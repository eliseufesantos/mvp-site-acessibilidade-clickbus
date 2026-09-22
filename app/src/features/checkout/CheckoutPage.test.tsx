// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { CheckoutPage } from './CheckoutPage';
import { trips } from '../../data/trips';
import { getDefaultPreferences } from '../accessibility-agent/core/preferences';

/*
 * O único formulário da jornada. As regras de validação importam, mas o que um
 * teste de lógica não pegaria é como o erro chega a quem não enxerga a tela:
 * o resumo recebe o foco e é anunciado, e cada campo aponta para a própria
 * mensagem. Um campo marcado como inválido sem dizer por quê é, para um leitor
 * de tela, só "inválido".
 */

const setup = () => {
  const onComplete = vi.fn();
  const user = userEvent.setup({ delay: null });
  render(
    <CheckoutPage
      onBack={vi.fn()}
      onComplete={onComplete}
      preferences={getDefaultPreferences()}
      search={{ origin: trips[0].origin, destination: trips[0].destination, date: '2026-09-27' }}
      seat={12}
      trip={trips[0]}
    />,
  );
  const campo = {
    nome: screen.getByLabelText('Nome completo'),
    cpf: screen.getByLabelText('CPF'),
    nascimento: screen.getByLabelText('Data de nascimento'),
    consentimento: screen.getByRole('checkbox'),
  };
  const enviar = () => user.click(screen.getByRole('button', { name: /concluir simulação/i }));
  const preencherValido = async () => {
    await user.type(campo.nome, 'Maria da Silva');
    await user.type(campo.cpf, '52998224725');
    await user.type(campo.nascimento, '01011990');
    await user.click(campo.consentimento);
  };
  return { user, campo, enviar, preencherValido, onComplete };
};

afterEach(cleanup);

describe('erros de validação', () => {
  test('enviar vazio anuncia um resumo com a contagem e leva o foco até ele', async () => {
    const { enviar } = setup();
    await enviar();
    const resumo = screen.getByRole('alert');
    expect(resumo).toHaveTextContent('Revise os campos destacados');
    expect(resumo).toHaveTextContent('Há 4 itens pendentes.');
    await waitFor(() => expect(resumo).toHaveFocus());
  });

  test('cada campo inválido diz por quê: a mensagem é a descrição acessível dele', async () => {
    const { campo, enviar } = setup();
    await enviar();
    expect(campo.nome).toHaveAttribute('aria-invalid', 'true');
    expect(campo.nome).toHaveAccessibleDescription('Informe o nome completo do passageiro.');
    expect(campo.cpf).toHaveAccessibleDescription('Informe um CPF com 11 números.');
    expect(campo.nascimento).toHaveAccessibleDescription('Informe a data no formato DD/MM/AAAA.');
    expect(campo.consentimento).toHaveAccessibleDescription('Confirme que os dados são fictícios para continuar.');
  });

  test('corrigir um campo apaga só o erro dele', async () => {
    const { user, campo, enviar } = setup();
    await enviar();
    await user.type(campo.nome, 'Maria da Silva');
    expect(campo.nome).toHaveAttribute('aria-invalid', 'false');
    expect(campo.nome).not.toHaveAccessibleDescription();
    expect(campo.cpf).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Há 3 itens pendentes.');
  });

  test('com um só pendente, o resumo usa o singular', async () => {
    const { user, campo, enviar } = setup();
    await user.type(campo.nome, 'Maria da Silva');
    await user.type(campo.cpf, '52998224725');
    await user.type(campo.nascimento, '01011990');
    await enviar();
    expect(screen.getByRole('alert')).toHaveTextContent('Há 1 item pendente.');
  });
});

describe('regras dos campos', () => {
  test.each([
    ['Jo', true],
    ['Ana', false],
    ['   Jo   ', true],
  ])('nome "%s" é inválido: %s', async (nome, invalido) => {
    const { user, campo, enviar } = setup();
    await user.type(campo.nome, nome);
    await enviar();
    expect(campo.nome).toHaveAttribute('aria-invalid', String(invalido));
  });

  test('o CPF descarta o que não é número enquanto se digita', async () => {
    const { user, campo } = setup();
    await user.type(campo.cpf, '529.982.247-25');
    expect(campo.cpf).toHaveValue('52998224725');
  });

  test('o CPF precisa de exatamente 11 números', async () => {
    const { user, campo, enviar } = setup();
    await user.type(campo.cpf, '5299822472');
    await enviar();
    expect(campo.cpf).toHaveAttribute('aria-invalid', 'true');
  });

  test('a data de nascimento ganha as barras enquanto se digita', async () => {
    const { user, campo } = setup();
    await user.type(campo.nascimento, '0');
    expect(campo.nascimento).toHaveValue('0');
    await user.type(campo.nascimento, '1');
    expect(campo.nascimento).toHaveValue('01');
    await user.type(campo.nascimento, '01');
    expect(campo.nascimento).toHaveValue('01/01');
    await user.type(campo.nascimento, '1990');
    expect(campo.nascimento).toHaveValue('01/01/1990');
  });

  test('uma data incompleta é recusada', async () => {
    const { user, campo, enviar } = setup();
    await user.type(campo.nascimento, '010119');
    await enviar();
    expect(campo.nascimento).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('envio', () => {
  test('o formulário válido conclui uma única vez, sem resumo de erro', async () => {
    const { preencherValido, enviar, onComplete } = setup();
    await preencherValido();
    await enviar();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  test('o formulário inválido não conclui', async () => {
    const { enviar, onComplete } = setup();
    await enviar();
    expect(onComplete).not.toHaveBeenCalled();
  });

  test('sem o consentimento, o resto válido não basta', async () => {
    const { user, campo, enviar, onComplete } = setup();
    await user.type(campo.nome, 'Maria da Silva');
    await user.type(campo.cpf, '52998224725');
    await user.type(campo.nascimento, '01011990');
    await enviar();
    expect(onComplete).not.toHaveBeenCalled();
    expect(campo.consentimento).toHaveAttribute('aria-invalid', 'true');
  });
});
