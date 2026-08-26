from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "Resumo_Implementacao_MVP_ClickBus_Acessivel.pdf"
SCREENSHOT = ROOT / "docs" / "implementation" / "checkout-alto-contraste-modo-idoso.png"

PURPLE = colors.HexColor("#A528FF")
PURPLE_DARK = colors.HexColor("#8629CC")
YELLOW = colors.HexColor("#FFC800")
INK = colors.HexColor("#222222")
MUTED = colors.HexColor("#5F5F5F")
BORDER = colors.HexColor("#D6D6D6")
SURFACE = colors.HexColor("#F7F4F9")
WHITE = colors.white


def register_fonts():
    regular = Path(r"C:\Windows\Fonts\arial.ttf")
    bold = Path(r"C:\Windows\Fonts\arialbd.ttf")
    if regular.exists() and bold.exists():
        pdfmetrics.registerFont(TTFont("CBRegular", str(regular)))
        pdfmetrics.registerFont(TTFont("CBBold", str(bold)))
        return "CBRegular", "CBBold"
    return "Helvetica", "Helvetica-Bold"


REGULAR, BOLD = register_fonts()


def page_chrome(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(PURPLE)
    canvas.rect(0, height - 7 * mm, width, 7 * mm, stroke=0, fill=1)
    canvas.setFillColor(INK)
    canvas.setFont(BOLD, 10)
    canvas.drawString(18 * mm, height - 15 * mm, "CLICKBUS | MVP ACESSIVEL")
    canvas.setStrokeColor(BORDER)
    canvas.line(18 * mm, 14 * mm, width - 18 * mm, 14 * mm)
    canvas.setFillColor(MUTED)
    canvas.setFont(REGULAR, 8)
    canvas.drawString(18 * mm, 9 * mm, "Projeto academico - nenhum pagamento e processado")
    canvas.drawRightString(width - 18 * mm, 9 * mm, f"Pagina {doc.page}")
    canvas.restoreState()


styles = getSampleStyleSheet()
title = ParagraphStyle(
    "TitleCB",
    parent=styles["Title"],
    fontName=BOLD,
    fontSize=28,
    leading=32,
    textColor=INK,
    alignment=TA_LEFT,
    spaceAfter=8 * mm,
)
subtitle = ParagraphStyle(
    "SubtitleCB",
    parent=styles["BodyText"],
    fontName=REGULAR,
    fontSize=12,
    leading=18,
    textColor=MUTED,
    spaceAfter=8 * mm,
)
heading = ParagraphStyle(
    "HeadingCB",
    parent=styles["Heading2"],
    fontName=BOLD,
    fontSize=18,
    leading=22,
    textColor=INK,
    spaceBefore=3 * mm,
    spaceAfter=4 * mm,
)
page_title = ParagraphStyle(
    "PageTitleCB",
    parent=title,
    fontSize=24,
    leading=28,
    spaceAfter=6 * mm,
)
body = ParagraphStyle(
    "BodyCB",
    parent=styles["BodyText"],
    fontName=REGULAR,
    fontSize=10,
    leading=15,
    textColor=INK,
    spaceAfter=3 * mm,
)
small = ParagraphStyle(
    "SmallCB",
    parent=body,
    fontSize=8.5,
    leading=12,
    textColor=MUTED,
)
card_title = ParagraphStyle(
    "CardTitle",
    parent=body,
    fontName=BOLD,
    fontSize=10.5,
    leading=13,
    textColor=PURPLE_DARK,
    spaceAfter=2 * mm,
)
metric = ParagraphStyle(
    "Metric",
    parent=body,
    fontName=BOLD,
    fontSize=17,
    leading=20,
    alignment=TA_CENTER,
    textColor=INK,
)
metric_label = ParagraphStyle(
    "MetricLabel",
    parent=small,
    alignment=TA_CENTER,
    textColor=MUTED,
)


def metric_box(value, label):
    return [Paragraph(value, metric), Paragraph(label, metric_label)]


def feature_cell(name, implementation, reason):
    return [
        Paragraph(name, card_title),
        Paragraph(implementation, body),
        Paragraph(f"<b>Justificativa:</b> {reason}", small),
    ]


def build_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    document = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=23 * mm,
        bottomMargin=20 * mm,
        title="Resumo da Implementacao do MVP ClickBus Acessivel",
        author="Projeto academico ClickBus",
        subject="Implementacoes e justificativas do MVP de acessibilidade",
    )

    story = []
    story.append(Spacer(1, 13 * mm))
    story.append(Paragraph("MVP ClickBus<br/><font color='#A528FF'>acessivel</font>", title))
    story.append(
        Paragraph(
            "Resumo breve das funcionalidades implementadas, das decisoes de escopo e dos ganhos esperados para a jornada de compra.",
            subtitle,
        )
    )

    notice = Table(
        [[Paragraph("ESCOPO ACADEMICO", card_title), Paragraph("Frontend funcional com dados locais e ficticios. Sem backend, emissao de passagem ou pagamento.", body)]],
        colWidths=[42 * mm, 118 * mm],
    )
    notice.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFF8D7")),
                ("BOX", (0, 0), (-1, -1), 1.2, colors.HexColor("#D79D00")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story.append(notice)
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph("Objetivo", heading))
    story.append(
        Paragraph(
            "Recriar a jornada principal da ClickBus com quick wins de acessibilidade que sejam baratos de implementar, visualmente evidentes e reutilizaveis em todo o fluxo.",
            body,
        )
    )
    story.append(Spacer(1, 5 * mm))

    metrics = Table(
        [[metric_box("5", "etapas de tela"), metric_box("3", "modos visuais"), metric_box("2", "viewports testados"), metric_box("0", "pagamentos reais")]],
        colWidths=[40 * mm] * 4,
    )
    metrics.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), SURFACE),
                ("GRID", (0, 0), (-1, -1), 0.8, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 12),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    story.append(metrics)
    story.append(Spacer(1, 9 * mm))
    story.append(Paragraph("Resultado esperado", heading))
    story.append(
        Paragraph(
            "O MVP demonstra que ajustes concentrados em tokens visuais, semantica, foco, tamanho de controles e simplificacao de conteudo podem melhorar a experiencia sem reconstruir toda a plataforma.",
            body,
        )
    )
    story.append(PageBreak())

    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph("O que foi implementado e por que", page_title))
    feature_rows = [
        [
            feature_cell(
                "Busca e resultados",
                "Origem, destino, data, viagens ficticias e filtros imediatos.",
                "Mantem a tarefa central reconhecivel e permite demonstrar o ganho sem depender de API.",
            ),
            feature_cell(
                "Selecao de assento",
                "Mapa simplificado, estados livre/ocupado/selecionado e navegacao por setas.",
                "Reduz ambiguidade e cria alvos maiores para teclado, mouse e toque.",
            ),
        ],
        [
            feature_cell(
                "Alto contraste",
                "Tokens globais em preto, branco e amarelo, com bordas e foco reforcados.",
                "Uma unica camada CSS gera retorno visual imediato em toda a jornada.",
            ),
            feature_cell(
                "Modo idoso",
                "Fonte, controles e espacamentos maiores, com retirada de conteudo secundario.",
                "Diminui esforco visual e motor sem criar uma experiencia separada.",
            ),
        ],
        [
            feature_cell(
                "Validacao acessivel",
                "Resumo de erros focavel, mensagens associadas aos campos e remocao ao corrigir.",
                "Ajuda o usuario a entender e resolver cada problema com menos retrabalho.",
            ),
            feature_cell(
                "Preferencias persistentes",
                "Contraste, modo idoso e movimento reduzido ficam salvos no navegador.",
                "Evita repetir configuracoes durante o fluxo e nao exige cadastro.",
            ),
        ],
    ]
    features = Table(feature_rows, colWidths=[78 * mm, 78 * mm], hAlign="LEFT")
    features.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), WHITE),
                ("BOX", (0, 0), (-1, -1), 0.8, BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.8, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 11),
                ("RIGHTPADDING", (0, 0), (-1, -1), 11),
                ("TOPPADDING", (0, 0), (-1, -1), 11),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(features)
    story.append(Spacer(1, 7 * mm))
    story.append(Paragraph("Decisoes de baixo custo", heading))
    decisions = [
        ["Decisao", "Justificativa e retorno"],
        ["React sem roteador", "O fluxo e linear; menos dependencia e menor custo de manutencao."],
        ["Dados locais", "Demonstracao previsivel, segura e independente de servicos externos."],
        ["Tokens CSS", "Uma alteracao controla todas as telas e facilita futuras evolucoes."],
        ["Sem pagamento", "Evita risco, dados sensiveis e trabalho fora do escopo academico."],
    ]
    decision_table = Table(decisions, colWidths=[48 * mm, 108 * mm], repeatRows=1)
    decision_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), PURPLE),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), BOLD),
                ("FONTNAME", (0, 1), (-1, -1), REGULAR),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.6, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story.append(decision_table)
    story.append(PageBreak())

    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph("Evidencia e validacao", page_title))
    story.append(
        Paragraph(
            "Tela real do MVP com alto contraste e modo idoso ativos. O estado combina tipografia ampliada, controles grandes, preto, branco e amarelo e um aviso explicito de simulacao.",
            body,
        )
    )
    if SCREENSHOT.exists():
        screenshot = Image(str(SCREENSHOT), width=156 * mm, height=130 * mm)
        screenshot.hAlign = "CENTER"
        story.append(screenshot)
        story.append(Spacer(1, 3 * mm))
        story.append(Paragraph("Checkout simulado - captura da implementacao em 1440 px.", small))
    else:
        story.append(Paragraph("Captura indisponivel neste ambiente; a validacao funcional permanece registrada no guia de QA.", small))

    story.append(Spacer(1, 5 * mm))
    qa_data = [
        ["Verificacao", "Resultado"],
        ["Typecheck e build Vite", "Aprovados"],
        ["Jornada completa", "Aprovada"],
        ["Console do navegador", "Sem erros"],
        ["Desktop 1440 x 900", "Aprovado"],
        ["Mobile 390 x 844", "Sem overflow horizontal"],
    ]
    qa_table = Table(qa_data, colWidths=[76 * mm, 80 * mm], repeatRows=1)
    qa_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), INK),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), BOLD),
                ("FONTNAME", (0, 1), (-1, -1), REGULAR),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("GRID", (0, 0), (-1, -1), 0.6, BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.append(qa_table)
    story.append(Spacer(1, 4 * mm))
    story.append(
        Paragraph(
            "<b>Limite assumido:</b> o MVP nao substitui uma auditoria completa com leitores de tela reais. Integracao com API, autenticacao, compra, pagamento e emissao permanecem fora do escopo.",
            small,
        )
    )

    document.build(story, onFirstPage=page_chrome, onLaterPages=page_chrome)


if __name__ == "__main__":
    build_pdf()
    print(OUTPUT)
