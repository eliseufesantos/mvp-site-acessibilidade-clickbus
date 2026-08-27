"""Gera o escopo técnico do MVP em DOCX.

    python scripts/build_mvp_scope.py

Saída: entregas/Escopo_Tecnico_MVP_ClickBus_Web.docx

Requisitos: Python 3 e python-docx (pip install python-docx). O PDF equivalente
em entregas/ foi exportado a partir deste DOCX.

Atenção: o documento embute quatro capturas da auditoria, que não fazem mais
parte da árvore do repositório. Antes de rodar, restaure-as do histórico:

    git checkout 5ebc728 -- docs/audit

Este script foi recuperado de uma pasta temporária e teve os caminhos
atualizados para a estrutura atual, mas não foi executado desde então: não há
Python instalado na máquina onde a migração aconteceu.
"""

from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "entregas" / "Escopo_Tecnico_MVP_ClickBus_Web.docx"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
AUDIT = ROOT / "docs" / "audit"

PURPLE = "5F23E8"
DARK = "27133D"
INK = "1F1F1F"
MUTED = "666666"
LIGHT_PURPLE = "F4EEFF"
LIGHT_GRAY = "F2F4F7"
BORDER = "D9DDE3"
WHITE = "FFFFFF"
GREEN = "18794E"
AMBER = "8A5A00"
RED = "A61B1B"


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=80, start=120, bottom=80, end=120):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for name, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{name}"))
        if node is None:
            node = OxmlElement(f"w:{name}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_cell_width(cell, width_dxa):
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_w = tc_pr.find(qn("w:tcW"))
    if tc_w is None:
        tc_w = OxmlElement("w:tcW")
        tc_pr.append(tc_w)
    tc_w.set(qn("w:w"), str(width_dxa))
    tc_w.set(qn("w:type"), "dxa")


def set_table_geometry(table, widths_dxa, indent_dxa=120):
    table.autofit = False
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    tbl_pr = table._tbl.tblPr

    layout = tbl_pr.find(qn("w:tblLayout"))
    if layout is None:
        layout = OxmlElement("w:tblLayout")
        tbl_pr.append(layout)
    layout.set(qn("w:type"), "fixed")

    tbl_w = tbl_pr.find(qn("w:tblW"))
    if tbl_w is None:
        tbl_w = OxmlElement("w:tblW")
        tbl_pr.append(tbl_w)
    tbl_w.set(qn("w:w"), str(sum(widths_dxa)))
    tbl_w.set(qn("w:type"), "dxa")

    tbl_ind = tbl_pr.find(qn("w:tblInd"))
    if tbl_ind is None:
        tbl_ind = OxmlElement("w:tblInd")
        tbl_pr.append(tbl_ind)
    tbl_ind.set(qn("w:w"), str(indent_dxa))
    tbl_ind.set(qn("w:type"), "dxa")

    grid = table._tbl.tblGrid
    for child in list(grid):
        grid.remove(child)
    for width in widths_dxa:
        grid_col = OxmlElement("w:gridCol")
        grid_col.set(qn("w:w"), str(width))
        grid.append(grid_col)

    for row in table.rows:
        for index, cell in enumerate(row.cells):
            set_cell_width(cell, widths_dxa[index])
            set_cell_margins(cell)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER


def set_table_borders(table, color=BORDER, size=6):
    tbl_pr = table._tbl.tblPr
    borders = tbl_pr.find(qn("w:tblBorders"))
    if borders is None:
        borders = OxmlElement("w:tblBorders")
        tbl_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = borders.find(qn(f"w:{edge}"))
        if tag is None:
            tag = OxmlElement(f"w:{edge}")
            borders.append(tag)
        tag.set(qn("w:val"), "single")
        tag.set(qn("w:sz"), str(size))
        tag.set(qn("w:space"), "0")
        tag.set(qn("w:color"), color)


def mark_header_row(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def set_run_font(run, name="Calibri", size=11, color=INK, bold=None, italic=None):
    run.font.name = name
    run._element.get_or_add_rPr().rFonts.set(qn("w:ascii"), name)
    run._element.get_or_add_rPr().rFonts.set(qn("w:hAnsi"), name)
    run._element.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), name)
    lang = run._element.get_or_add_rPr().find(qn("w:lang"))
    if lang is None:
        lang = OxmlElement("w:lang")
        run._element.get_or_add_rPr().append(lang)
    lang.set(qn("w:val"), "pt-BR")
    run.font.size = Pt(size)
    run.font.color.rgb = RGBColor.from_string(color)
    if bold is not None:
        run.bold = bold
    if italic is not None:
        run.italic = italic


def add_numbering_definition(doc, ordered=False):
    numbering = doc.part.numbering_part.element
    abstract_ids = [int(x.get(qn("w:abstractNumId"))) for x in numbering.findall(qn("w:abstractNum"))]
    num_ids = [int(x.get(qn("w:numId"))) for x in numbering.findall(qn("w:num"))]
    abstract_id = max(abstract_ids, default=0) + 1
    num_id = max(num_ids, default=0) + 1

    abstract = OxmlElement("w:abstractNum")
    abstract.set(qn("w:abstractNumId"), str(abstract_id))
    nsid = OxmlElement("w:nsid")
    nsid.set(qn("w:val"), f"A11C{abstract_id:04X}")
    abstract.append(nsid)
    multi = OxmlElement("w:multiLevelType")
    multi.set(qn("w:val"), "singleLevel")
    abstract.append(multi)
    tmpl = OxmlElement("w:tmpl")
    tmpl.set(qn("w:val"), f"CB05{abstract_id:04X}")
    abstract.append(tmpl)

    lvl = OxmlElement("w:lvl")
    lvl.set(qn("w:ilvl"), "0")
    start = OxmlElement("w:start")
    start.set(qn("w:val"), "1")
    lvl.append(start)
    num_fmt = OxmlElement("w:numFmt")
    num_fmt.set(qn("w:val"), "decimal" if ordered else "bullet")
    lvl.append(num_fmt)
    lvl_text = OxmlElement("w:lvlText")
    lvl_text.set(qn("w:val"), "%1." if ordered else "\uf0b7")
    lvl.append(lvl_text)
    jc = OxmlElement("w:lvlJc")
    jc.set(qn("w:val"), "left")
    lvl.append(jc)
    p_pr = OxmlElement("w:pPr")
    tabs = OxmlElement("w:tabs")
    tab = OxmlElement("w:tab")
    tab.set(qn("w:val"), "num")
    tab.set(qn("w:pos"), "720")
    tabs.append(tab)
    p_pr.append(tabs)
    ind = OxmlElement("w:ind")
    ind.set(qn("w:left"), "720")
    ind.set(qn("w:hanging"), "360")
    p_pr.append(ind)
    spacing = OxmlElement("w:spacing")
    spacing.set(qn("w:after"), "160")
    spacing.set(qn("w:line"), "280")
    spacing.set(qn("w:lineRule"), "auto")
    p_pr.append(spacing)
    lvl.append(p_pr)
    if not ordered:
        r_pr = OxmlElement("w:rPr")
        r_fonts = OxmlElement("w:rFonts")
        r_fonts.set(qn("w:ascii"), "Symbol")
        r_fonts.set(qn("w:hAnsi"), "Symbol")
        r_fonts.set(qn("w:hint"), "default")
        r_pr.append(r_fonts)
        lvl.append(r_pr)
    abstract.append(lvl)
    # OOXML requires every abstractNum before every num. Inserting a new
    # abstract definition after existing num nodes makes Word repair the file
    # and collapse all lists into one decimal sequence.
    first_num = numbering.find(qn("w:num"))
    if first_num is None:
        numbering.append(abstract)
    else:
        numbering.insert(numbering.index(first_num), abstract)

    num = OxmlElement("w:num")
    num.set(qn("w:numId"), str(num_id))
    abstract_num_id = OxmlElement("w:abstractNumId")
    abstract_num_id.set(qn("w:val"), str(abstract_id))
    num.append(abstract_num_id)
    numbering.append(num)
    return num_id


def apply_numbering(paragraph, num_id):
    p_pr = paragraph._p.get_or_add_pPr()
    num_pr = p_pr.find(qn("w:numPr"))
    if num_pr is None:
        num_pr = OxmlElement("w:numPr")
        p_pr.append(num_pr)
    ilvl = OxmlElement("w:ilvl")
    ilvl.set(qn("w:val"), "0")
    num_id_el = OxmlElement("w:numId")
    num_id_el.set(qn("w:val"), str(num_id))
    num_pr.append(ilvl)
    num_pr.append(num_id_el)


def add_bullet(doc, text, num_id, bold_prefix=None):
    p = doc.add_paragraph(style="Body Text")
    apply_numbering(p, num_id)
    p.paragraph_format.left_indent = Inches(0.5)
    p.paragraph_format.first_line_indent = Inches(-0.25)
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.line_spacing = 1.167
    if bold_prefix and text.startswith(bold_prefix):
        r1 = p.add_run(bold_prefix)
        set_run_font(r1, bold=True)
        r2 = p.add_run(text[len(bold_prefix):])
        set_run_font(r2)
    else:
        r = p.add_run(text)
        set_run_font(r)
    return p


def add_numbered(doc, text, num_id, bold_prefix=None):
    p = doc.add_paragraph(style="Body Text")
    apply_numbering(p, num_id)
    p.paragraph_format.left_indent = Inches(0.5)
    p.paragraph_format.first_line_indent = Inches(-0.25)
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.line_spacing = 1.167
    if bold_prefix and text.startswith(bold_prefix):
        r1 = p.add_run(bold_prefix)
        set_run_font(r1, bold=True)
        r2 = p.add_run(text[len(bold_prefix):])
        set_run_font(r2)
    else:
        r = p.add_run(text)
        set_run_font(r)
    return p


def add_heading(doc, text, level=1):
    p = doc.add_paragraph(text, style=f"Heading {level}")
    p.paragraph_format.keep_with_next = True
    return p


def add_body(doc, text, bold_prefix=None):
    p = doc.add_paragraph(style="Body Text")
    if bold_prefix and text.startswith(bold_prefix):
        r1 = p.add_run(bold_prefix)
        set_run_font(r1, bold=True)
        r2 = p.add_run(text[len(bold_prefix):])
        set_run_font(r2)
    else:
        r = p.add_run(text)
        set_run_font(r)
    return p


def add_figure(doc, image_path, caption, alt_text, width_inches=6.2):
    image_paragraph = doc.add_paragraph()
    image_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    image_paragraph.paragraph_format.space_before = Pt(2)
    image_paragraph.paragraph_format.space_after = Pt(5)
    image_paragraph.paragraph_format.keep_with_next = True
    shape = image_paragraph.add_run().add_picture(str(image_path), width=Inches(width_inches))
    doc_pr = shape._inline.docPr
    doc_pr.set("descr", alt_text)
    doc_pr.set("title", caption)

    caption_paragraph = doc.add_paragraph()
    caption_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    caption_paragraph.paragraph_format.space_before = Pt(0)
    caption_paragraph.paragraph_format.space_after = Pt(8)
    caption_paragraph.paragraph_format.keep_with_next = True
    caption_run = caption_paragraph.add_run(caption)
    set_run_font(caption_run, size=9, color=MUTED, italic=True)
    return shape


def add_callout(doc, label, text, fill=LIGHT_PURPLE, color=DARK):
    table = doc.add_table(rows=1, cols=1)
    # The callout is a one-row informational table; marking the row avoids
    # assistive technology treating it as an unlabeled data table.
    mark_header_row(table.rows[0])
    set_table_geometry(table, [9360], indent_dxa=120)
    set_table_borders(table, color=PURPLE, size=8)
    cell = table.cell(0, 0)
    set_cell_shading(cell, fill)
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    r1 = p.add_run(f"{label}: ")
    set_run_font(r1, size=11, color=color, bold=True)
    r2 = p.add_run(text)
    set_run_font(r2, size=11, color=color)
    after = doc.add_paragraph()
    after.paragraph_format.space_after = Pt(0)
    after.paragraph_format.space_before = Pt(2)
    return table


def add_table(doc, headers, rows, widths_dxa, font_size=9.5):
    table = doc.add_table(rows=1, cols=len(headers))
    set_table_geometry(table, widths_dxa)
    set_table_borders(table)
    mark_header_row(table.rows[0])
    for index, header in enumerate(headers):
        cell = table.rows[0].cells[index]
        set_cell_shading(cell, LIGHT_GRAY)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(header)
        set_run_font(r, size=font_size, color=DARK, bold=True)

    for row_values in rows:
        row = table.add_row()
        for index, value in enumerate(row_values):
            cell = row.cells[index]
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.08
            r = p.add_run(str(value))
            set_run_font(r, size=font_size, color=INK)
    set_table_geometry(table, widths_dxa)
    spacer = doc.add_paragraph()
    spacer.paragraph_format.space_before = Pt(0)
    spacer.paragraph_format.space_after = Pt(2)
    return table


def add_hyperlink(paragraph, text, url):
    part = paragraph.part
    relationship_id = part.relate_to(
        url,
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
        is_external=True,
    )
    hyperlink = OxmlElement("w:hyperlink")
    hyperlink.set(qn("r:id"), relationship_id)
    run = OxmlElement("w:r")
    r_pr = OxmlElement("w:rPr")
    color = OxmlElement("w:color")
    color.set(qn("w:val"), PURPLE)
    r_pr.append(color)
    underline = OxmlElement("w:u")
    underline.set(qn("w:val"), "single")
    r_pr.append(underline)
    lang = OxmlElement("w:lang")
    lang.set(qn("w:val"), "pt-BR")
    r_pr.append(lang)
    run.append(r_pr)
    text_el = OxmlElement("w:t")
    text_el.text = text
    run.append(text_el)
    hyperlink.append(run)
    paragraph._p.append(hyperlink)


def add_page_number(paragraph):
    run = paragraph.add_run("Página ")
    set_run_font(run, size=9, color=MUTED)
    fld_char1 = OxmlElement("w:fldChar")
    fld_char1.set(qn("w:fldCharType"), "begin")
    instr_text = OxmlElement("w:instrText")
    instr_text.set(qn("xml:space"), "preserve")
    instr_text.text = " PAGE "
    fld_char2 = OxmlElement("w:fldChar")
    fld_char2.set(qn("w:fldCharType"), "end")
    run._r.append(fld_char1)
    run._r.append(instr_text)
    run._r.append(fld_char2)


doc = Document()
section = doc.sections[0]
section.page_width = Inches(8.5)
section.page_height = Inches(11)
section.top_margin = Inches(1)
section.right_margin = Inches(1)
section.bottom_margin = Inches(1)
section.left_margin = Inches(1)
section.header_distance = Inches(0.492)
section.footer_distance = Inches(0.492)

styles = doc.styles
normal = styles["Normal"]
normal.font.name = "Calibri"
normal._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
normal.font.size = Pt(11)
normal.font.color.rgb = RGBColor.from_string(INK)
normal.paragraph_format.space_before = Pt(0)
normal.paragraph_format.space_after = Pt(6)
normal.paragraph_format.line_spacing = 1.10

body_style = styles["Body Text"]
body_style.font.name = "Calibri"
body_style._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
body_style._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
body_style.font.size = Pt(11)
body_style.font.color.rgb = RGBColor.from_string(INK)
body_style.paragraph_format.space_before = Pt(0)
body_style.paragraph_format.space_after = Pt(6)
body_style.paragraph_format.line_spacing = 1.10

heading_tokens = {
    1: (16, 16, 8, PURPLE),
    2: (13, 12, 6, PURPLE),
    3: (12, 8, 4, DARK),
}
for level, (size, before, after, color) in heading_tokens.items():
    style = styles[f"Heading {level}"]
    style.font.name = "Calibri"
    style._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
    style._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
    style.font.size = Pt(size)
    style.font.bold = True
    style.font.color.rgb = RGBColor.from_string(color)
    style.paragraph_format.space_before = Pt(before)
    style.paragraph_format.space_after = Pt(after)
    style.paragraph_format.keep_with_next = True

if "Kicker" not in styles:
    kicker_style = styles.add_style("Kicker", WD_STYLE_TYPE.PARAGRAPH)
else:
    kicker_style = styles["Kicker"]
kicker_style.font.name = "Calibri"
kicker_style._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
kicker_style._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
kicker_style.font.size = Pt(10)
kicker_style.font.bold = True
kicker_style.font.color.rgb = RGBColor.from_string(PURPLE)
kicker_style.paragraph_format.space_after = Pt(4)

bullet_num_id = add_numbering_definition(doc, ordered=False)
decimal_num_id = add_numbering_definition(doc, ordered=True)

header = section.header
hp = header.paragraphs[0]
hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
hp.paragraph_format.space_after = Pt(0)
hr = hp.add_run("FIAP NEXT 2026 | ClickBus Inclusive Journey")
set_run_font(hr, size=9, color=MUTED, bold=True)

footer = section.footer
fp = footer.paragraphs[0]
fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
fp.paragraph_format.space_after = Pt(0)
fr = fp.add_run("ClickBus Web Acessível | ")
set_run_font(fr, size=9, color=MUTED)
add_page_number(fp)

doc.core_properties.title = "Escopo Técnico do MVP - ClickBus Web Acessível"
doc.core_properties.subject = "Projeto acadêmico FIAP NEXT 2026"
doc.core_properties.author = "Equipe FIAP - Projeto ClickBus Inclusive Journey"
doc.core_properties.keywords = "ClickBus, acessibilidade, MVP, quick wins, WCAG 2.2"

# First-page memo masthead.
p = doc.add_paragraph(style="Kicker")
p.paragraph_format.space_before = Pt(8)
p.add_run("PROJETO ACADÊMICO | ESCOPO TÉCNICO")

title = doc.add_paragraph()
title.paragraph_format.space_before = Pt(0)
title.paragraph_format.space_after = Pt(4)
tr = title.add_run("Escopo Técnico do MVP")
set_run_font(tr, size=26, color=DARK, bold=True)

subtitle = doc.add_paragraph()
subtitle.paragraph_format.space_after = Pt(16)
sr = subtitle.add_run("ClickBus Web Acessível - quick wins de baixo custo e alto retorno")
set_run_font(sr, size=14, color=MUTED)

for label, value in (
    ("Parceiro", "ClickBus"),
    ("Produto", "Site público de busca e compra de passagens"),
    ("Versão", "1.1 - 26 de agosto de 2026"),
    ("Status", "Base para protótipo e simulação acadêmica"),
):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(2)
    lr = p.add_run(f"{label}: ")
    set_run_font(lr, size=10.5, color=DARK, bold=True)
    vr = p.add_run(value)
    set_run_font(vr, size=10.5, color=INK)

spacer = doc.add_paragraph()
spacer.paragraph_format.space_after = Pt(4)

add_callout(
    doc,
    "Decisão de escopo",
    "O MVP atuará somente no site atual da ClickBus, da busca ao início do pagamento. Além das correções de navegação, haverá dois ganhos visuais evidentes e combináveis: modo Alto Contraste e modo Idoso (leitura ampliada). Não haverá app, totem, NFC, Bluetooth, painel de viação ou integração com motorista nesta fase.",
)

add_heading(doc, "1. Resumo executivo", 1)
add_body(
    doc,
    "Este documento define um MVP de acessibilidade digital para a jornada pública da ClickBus. A proposta prioriza mudanças pequenas e verificáveis sobre a experiência já existente, evitando uma reconstrução completa do produto. O resultado esperado é uma jornada mais clara, operável e visualmente adaptável para pessoas com deficiência, pessoas idosas, usuários com baixa familiaridade digital e qualquer pessoa em contexto de pressa ou baixa atenção.",
)
add_body(
    doc,
    "A lógica de retorno é simples: melhorias em busca, seleção de viagem, escolha de assento e checkout reduzem abandono, erros de interação e dependência do atendimento. Para o projeto acadêmico, os benefícios serão demonstrados por testes de tarefa e comparação entre a experiência atual e o protótipo proposto.",
)

add_heading(doc, "2. Contexto e problema", 1)
add_body(
    doc,
    "A jornada atual possui uma boa estrutura visual e um fluxo de compra conhecido, mas combina promoções, componentes dinâmicos e controles sem identificação suficiente. Na avaliação realizada, os principais atritos ocorreram antes do pagamento, justamente nas etapas com maior impacto sobre conversão.",
)

issues = [
    "Pop-ups e ofertas flutuantes competem com a busca e podem ocultar ações importantes.",
    "Sugestões de origem e destino não apresentam uma estrutura consistente de combobox e lista de opções para tecnologia assistiva.",
    "O calendário apresenta nomes acessíveis em inglês e pode gerar rolagem horizontal.",
    "Filtros e botões de seleção de viagem não possuem semântica ou nome acessível consistente.",
    "O mapa de assentos comunica estados em inglês e o botão de fechamento do modal não foi identificado adequadamente.",
    "Não existe uma entrada clara para preferências de acessibilidade no site.",
    "Textos compactos, ações próximas e sobreposições promocionais reduzem a leitura confortável para pessoas com baixa visão, menor precisão motora ou dificuldade de concentração.",
    "A experiência não oferece modos visuais explícitos para alto contraste ou leitura ampliada com controles maiores.",
]
for item in issues:
    add_bullet(doc, item, bullet_num_id)

doc.add_page_break()
add_heading(doc, "2.1 Evidências visuais do site atual", 2)
add_body(
    doc,
    "As capturas abaixo foram realizadas no site público da ClickBus em 26 de agosto de 2026. Elas não substituem uma auditoria formal, mas registram situações concretas que justificam os quick wins e facilitam a comparação visual com o futuro protótipo.",
)
add_figure(
    doc,
    AUDIT / "04-clickbus-home.png",
    "Figura 1 - Página inicial: promoção modal bloqueando a área principal de busca.",
    "Captura da página inicial da ClickBus com um modal promocional central sobre a busca de passagens e um botão flutuante do WhatsApp.",
)
add_callout(
    doc,
    "Leitura do problema",
    "A tarefa principal perde prioridade visual. No modo Idoso, promoções automáticas serão suprimidas durante a busca, os campos serão ampliados e a ação Buscar ficará mais evidente.",
)

doc.add_page_break()
add_heading(doc, "2.2 Calendário e densidade visual", 2)
add_figure(
    doc,
    AUDIT / "08-clickbus-date-picker.png",
    "Figura 2 - Calendário atual: dois meses, controles compactos e rolagem horizontal.",
    "Captura do calendário da ClickBus com dois meses lado a lado, datas pequenas, botão flutuante do WhatsApp e barra de rolagem horizontal na parte inferior.",
)
add_callout(
    doc,
    "Resposta do MVP",
    "O modo Idoso usará um mês por vez no celular, texto base maior, alvos de interação de pelo menos 48 por 48 CSS px e espaçamento ampliado. O conteúdo continuará responsivo sem perda de informação.",
)

doc.add_page_break()
add_heading(doc, "2.3 Resultados e competição por atenção", 2)
add_figure(
    doc,
    AUDIT / "09-clickbus-results.png",
    "Figura 3 - Resultados atuais: filtros, ofertas e pop-up competindo com a seleção da viagem.",
    "Captura da página de resultados da ClickBus com filtros laterais, banner promocional, card de viagem e um cupom flutuante cobrindo parte do conteúdo.",
)
add_callout(
    doc,
    "Resposta do MVP",
    "O Alto Contraste aumentará a separação entre conteúdo, controles e foco. O modo Idoso reduzirá elementos secundários, ampliará preço, horários e botões e apresentará uma ação principal por card.",
)

doc.add_page_break()
add_heading(doc, "2.4 Seleção de assento", 2)
add_figure(
    doc,
    AUDIT / "11-clickbus-seat-selection.png",
    "Figura 4 - Mapa atual: assentos e legenda concentrados em uma área compacta.",
    "Captura do modal de seleção de assento da ClickBus com informações da viação à esquerda e um mapa de assentos compacto com estados livre, escolhido e ocupado à direita.",
)
add_callout(
    doc,
    "Resposta do MVP",
    "Os assentos terão área de toque ampliada, número legível, estado por texto e forma além da cor, foco visível e leitura simplificada. Alto Contraste e modo Idoso poderão ser ativados juntos.",
)

doc.add_page_break()

add_heading(doc, "3. Objetivo do MVP", 1)
add_callout(
    doc,
    "Objetivo principal",
    "Permitir que uma pessoa conclua a jornada da página inicial até o início do pagamento com teclado, leitor de tela ou recursos visuais assistivos, sem perder informações essenciais e sem depender de ajuda externa.",
)

add_heading(doc, "3.1 Objetivos específicos", 2)
for item in (
    "Corrigir barreiras críticas de navegação e identificação dos controles.",
    "Preservar a identidade visual e o modelo atual de compra da ClickBus.",
    "Diminuir interferências promocionais durante a tarefa principal.",
    "Entregar ganho visual demonstrável por meio dos modos Alto Contraste e Idoso.",
    "Oferecer uma camada assistiva opcional, sem substituir a acessibilidade nativa.",
    "Gerar evidências acadêmicas por testes de usabilidade e métricas de tarefa.",
):
    add_bullet(doc, item, bullet_num_id)

add_heading(doc, "3.2 Hipótese de valor", 2)
add_body(
    doc,
    "Se a ClickBus remover distrações e tornar os componentes críticos semanticamente acessíveis, então mais usuários conseguirão avançar da busca ao checkout com menos erros, menor tempo de tarefa e menor necessidade de suporte. O retorno financeiro será tratado como hipótese, medido por progressão no funil e redução de abandono, e não como promessa de receita sem dados reais.",
)

add_heading(doc, "4. Escopo da jornada", 1)
add_table(
    doc,
    ["Etapa", "Tela ou componente", "Resultado esperado"],
    [
        ("1", "Página inicial e busca", "Informar origem, destino e data sem bloqueios."),
        ("2", "Resultados e filtros", "Comparar opções e selecionar uma viagem com clareza."),
        ("3", "Seleção de assento", "Escolher e confirmar um assento com estados compreensíveis."),
        ("4", "Início do checkout", "Preencher dados do passageiro e entender erros e próximos passos."),
    ],
    [720, 3240, 5400],
)

add_heading(doc, "4.1 Fora do escopo", 2)
for item in (
    "Aplicativo móvel nativo da ClickBus.",
    "Totem físico, ajuste de altura, NFC ou Bluetooth.",
    "Painel de viação e alertas para motorista.",
    "Compra real, antifraude, integração com meios de pagamento ou emissão de bilhete.",
    "Cadastro permanente de deficiência ou dados de saúde.",
    "Certificação formal de conformidade WCAG ou auditoria jurídica.",
    "Reforma visual completa, mudança de marca ou reestruturação do catálogo de viagens.",
):
    add_bullet(doc, item, bullet_num_id)

add_heading(doc, "5. Princípios de solução", 1)
principles = [
    ("Acessibilidade nativa primeiro", "HTML semântico, teclado, foco, nomes acessíveis, estados e mensagens de erro são a base."),
    ("Camada assistiva como complemento", "Rybená ou uma simulação equivalente pode oferecer Libras, voz, contraste e ampliação, mas não deve mascarar falhas estruturais."),
    ("Mudança visual perceptível", "Alto Contraste e modo Idoso devem alterar claramente cores, tipografia, tamanho dos controles, espaçamento e densidade, sem criar uma segunda jornada."),
    ("Menos interferência", "Promoções não podem bloquear a busca, os resultados, o mapa de assentos ou o checkout."),
    ("Melhoria incremental", "Os componentes atuais serão ajustados e reutilizados para reduzir custo e risco."),
    ("Privacidade por padrão", "Preferências visuais podem ser salvas na sessão, mas o MVP não coletará diagnóstico, deficiência ou necessidade médica."),
    ("Degradação segura", "Se a camada assistiva não carregar, a jornada principal continuará funcionando."),
]
for title_text, detail in principles:
    add_bullet(doc, f"{title_text}: {detail}", bullet_num_id, bold_prefix=f"{title_text}: ")

add_heading(doc, "6. Quick wins priorizados", 1)
add_table(
    doc,
    ["ID", "Quick win", "Vantagem real", "Esforço"],
    [
        ("QW-01", "Controlar pop-ups e ofertas", "Menos bloqueio e abandono no início da tarefa.", "Baixo"),
        ("QW-02", "Busca com combobox acessível", "Origem e destino utilizáveis por teclado e leitor de tela.", "Médio"),
        ("QW-03", "Calendário responsivo em português", "Menos erros de data e fim da rolagem horizontal.", "Médio"),
        ("QW-04", "Resultados e filtros semânticos", "Comparação mais rápida e botão de seleção identificável.", "Médio"),
        ("QW-05", "Mapa de assentos acessível", "Seleção autônoma e comunicação clara dos estados.", "Médio"),
        ("QW-06", "Checkout com foco e erros claros", "Menos retrabalho e maior confiança antes do pagamento.", "Baixo"),
        ("QW-07", "Modo Alto Contraste", "Leitura e foco mais evidentes em toda a jornada.", "Baixo"),
        ("QW-08", "Modo Idoso", "Texto, controles e espaçamento maiores, com menos distrações.", "Baixo"),
        ("QW-09", "Barra assistiva opcional", "Modos visuais, pausa de animações e ponto para voz/Libras em uma entrada única.", "Baixo*"),
        ("QW-10", "Métricas de tarefa", "Comprovação de benefício sem depender de receita real.", "Baixo"),
    ],
    [820, 2860, 4380, 1300],
    font_size=9,
)
add_body(
    doc,
    "* No protótipo acadêmico, a barra assistiva pode ser simulada. Em produção, o custo depende de licenciamento, integração e suporte da solução escolhida.",
)

add_heading(doc, "6.1 Especificação dos modos visuais", 2)
add_table(
    doc,
    ["Modo", "Transformação visível", "Regra técnica do MVP"],
    [
        ("Padrão acessível", "Identidade ClickBus preservada, com foco e semântica corrigidos.", "É a experiência-base; continua funcional sem ativar recursos extras."),
        ("Alto Contraste", "Fundo escuro neutro, texto branco, destaque amarelo, bordas e foco reforçados.", "Aplicar tokens CSS globais; eliminar texto sobre imagem e não transmitir estado apenas por cor."),
        ("Idoso - leitura ampliada", "Texto base maior, botões grandes, mais espaço e menos conteúdo promocional concorrente.", "Texto base mínimo de 18 CSS px; controles principais de pelo menos 48 x 48 CSS px; espaçamento ampliado em cerca de 25%."),
        ("Combinado", "Leitura ampliada usando simultaneamente a paleta de alto contraste.", "Os modos devem ser independentes, combináveis e reversíveis sem recarregar a página."),
    ],
    [1900, 3500, 3960],
    font_size=9.1,
)
add_body(
    doc,
    "O rótulo de interface poderá ser 'Modo Idoso - leitura ampliada' para tornar a finalidade clara sem infantilizar o usuário. As preferências serão opcionais e não exigirão declaração de idade, deficiência ou diagnóstico.",
)

add_heading(doc, "7. Requisitos funcionais", 1)
functional_rows = [
    ("RF-01", "Navegação inicial", "Disponibilizar link 'Pular para o conteúdo' e ordem de foco coerente."),
    ("RF-02", "Promoções", "Não abrir modal automaticamente durante a tarefa principal. Quando aberto, deve ter título, foco contido, botão Fechar nomeado e fechamento por Escape."),
    ("RF-03", "Origem e destino", "Implementar combobox com lista de opções, seleção por setas e Enter, fechamento por Escape e anúncio da quantidade de resultados."),
    ("RF-04", "Data da viagem", "Permitir digitação manual e calendário. Datas e controles devem ser anunciados em português e funcionar sem rolagem horizontal."),
    ("RF-05", "Cards de viagem", "Cada card deve fornecer empresa, horário, origem, destino, duração, assento, preço e botão 'Selecionar viagem'."),
    ("RF-06", "Filtros", "Usar checkboxes ou controles equivalentes com rótulos, estado marcado e atualização anunciada da lista."),
    ("RF-07", "Mapa de assentos", "Permitir navegação por teclado. Anunciar número e estado: livre, escolhido ou ocupado. Restaurar foco ao fechar o modal."),
    ("RF-08", "Checkout", "Manter rótulos persistentes, relacionar mensagens de erro aos campos e mover foco para o resumo de erros quando necessário."),
    ("RF-09", "Alto Contraste", "Disponibilizar alternância global com fundo escuro, texto claro, destaque amarelo, foco reforçado e estados que não dependam apenas de cor."),
    ("RF-10", "Modo Idoso", "Ampliar texto, controles e espaçamento; reduzir promoções concorrentes; manter rótulos textuais próximos aos ícones e uma ação principal por bloco."),
    ("RF-11", "Combinação de modos", "Permitir Alto Contraste e modo Idoso simultaneamente, com ativação reversível e sem perda da etapa atual."),
    ("RF-12", "Barra assistiva", "Reunir os modos visuais, pausa de animações e ponto de integração para voz/Libras, sem cobrir o CTA principal."),
    ("RF-13", "Preferências", "Salvar somente preferências visuais e de interação na sessão ou armazenamento local, sem identificar deficiência ou idade."),
    ("RF-14", "Telemetria", "Registrar eventos anônimos de avanço, erro, abandono e uso dos recursos assistivos."),
    ("RF-15", "Falha da camada assistiva", "Manter busca, resultados, assentos e checkout utilizáveis mesmo se o plugin assistivo falhar."),
]
add_table(doc, ["ID", "Área", "Requisito"], functional_rows, [900, 1800, 6660], font_size=9)

add_heading(doc, "8. Requisitos não funcionais", 1)
nfrs = [
    ("RNF-01", "Acessibilidade", "Adotar WCAG 2.2 nível AA como alvo técnico, sem declarar conformidade antes de testes."),
    ("RNF-02", "Teclado", "Toda ação da jornada deve ser operável sem mouse e sem armadilha de foco."),
    ("RNF-03", "Leitor de tela", "Testar ao menos com NVDA e Chrome em português no protótipo desktop."),
    ("RNF-04", "Reflow", "Não exigir rolagem horizontal na jornada principal em viewport equivalente a 320 CSS px, salvo conteúdo bidimensional essencial."),
    ("RNF-05", "Contraste", "Texto, foco e controles devem atingir contraste suficiente para o nível AA."),
    ("RNF-06", "Modos visuais", "As telas principal, resultados, assentos e checkout devem suportar Padrão, Alto Contraste, Idoso e Combinado sem corte de conteúdo."),
    ("RNF-07", "Desempenho", "A camada assistiva não deve bloquear a renderização ou impedir interação caso demore a carregar."),
    ("RNF-08", "Compatibilidade", "Priorizar navegadores modernos e comportamento responsivo em desktop e celular."),
    ("RNF-09", "Privacidade", "Não coletar dado de saúde, diagnóstico, deficiência ou idade no MVP."),
]
add_table(doc, ["ID", "Categoria", "Critério"], nfrs, [900, 1800, 6660], font_size=9.2)

add_heading(doc, "9. Fluxo proposto para a simulação", 1)
flow_steps = [
    ("Entrada", "Usuário acessa a página, ignora ou fecha ofertas sem perder foco e pode ativar Alto Contraste, modo Idoso ou ambos."),
    ("Busca", "Preenche origem, destino e data com teclado, mouse ou toque."),
    ("Comparação", "Filtra e ordena resultados; cada opção possui resumo e ação nomeada."),
    ("Assento", "Abre modal, navega pelos assentos e confirma a escolha."),
    ("Checkout", "Informa dados fictícios, recebe validações claras e visualiza o resumo da viagem."),
]
for label, detail in flow_steps:
    add_numbered(doc, f"{label}: {detail}", decimal_num_id, bold_prefix=f"{label}: ")

add_heading(doc, "10. Critérios de aceite e Definition of Done", 1)
acceptance = [
    "A jornada principal pode ser concluída somente com teclado.",
    "Não existe botão, campo ou link crítico sem nome acessível.",
    "A ordem de foco acompanha a ordem visual e o foco permanece visível.",
    "Autocomplete, calendário, filtros e mapa de assentos anunciam seus estados.",
    "Textos acessíveis e mensagens de estado estão em português do Brasil.",
    "Pop-ups não abrem automaticamente no meio da compra e não encobrem CTAs.",
    "O layout não apresenta corte ou rolagem horizontal indevida nos breakpoints testados.",
    "O modo Alto Contraste altera toda a jornada e mantém textos, controles, estados e foco claramente distinguíveis.",
    "O modo Idoso usa texto base de pelo menos 18 CSS px, controles principais de pelo menos 48 x 48 CSS px e menor competição promocional.",
    "Alto Contraste e modo Idoso funcionam juntos, podem ser desligados e não reiniciam a jornada.",
    "A ampliação não remove preço, horário, origem, destino, duração, assento ou mensagens de erro.",
    "Erros de formulário indicam o problema, o campo afetado e como corrigir.",
    "A jornada funciona mesmo com a barra assistiva desativada ou indisponível.",
    "O protótipo registra eventos de tarefa sem dados pessoais reais.",
    "Uma rodada de teste com pelo menos cinco participantes registra tempo, erros e conclusão.",
]
for item in acceptance:
    add_bullet(doc, item, bullet_num_id)

add_heading(doc, "11. Métricas para avaliação acadêmica", 1)
add_table(
    doc,
    ["Métrica", "Como medir", "Sinal de sucesso"],
    [
        ("Conclusão da tarefa", "Percentual que chega ao checkout sem ajuda.", "Melhora no protótipo em relação à experiência-base."),
        ("Tempo de tarefa", "Tempo da página inicial até o checkout.", "Redução sem aumento de erros."),
        ("Erros de interação", "Cliques inválidos, campos abandonados e tentativas repetidas.", "Menos erros por participante."),
        ("Uso por teclado", "Conclusão sem mouse e sem foco perdido.", "Todas as tarefas críticas concluídas."),
        ("Compreensão", "Perguntas sobre horário, preço, origem, destino e assento.", "Informações essenciais compreendidas."),
        ("Percepção de autonomia", "Escala curta após a tarefa.", "Maior confiança e menor necessidade de ajuda."),
        ("Efetividade visual", "Comparar leitura, cliques incorretos e preferência nos modos Padrão, Alto Contraste e Idoso.", "Melhor legibilidade percebida e menos erros nos modos adaptados."),
    ],
    [2500, 3360, 3500],
    font_size=9.2,
)
add_body(
    doc,
    "Taxa de conversão, redução do SAC e aumento de receita são benefícios esperados, mas exigem dados reais de produção. No projeto acadêmico, devem aparecer como hipóteses futuras, não como resultados comprovados.",
)

add_heading(doc, "12. Arquitetura e estratégia de implementação", 1)
add_body(
    doc,
    "A futura simulação será uma aplicação front-end baseada no fluxo público atual da ClickBus. Os dados de viagens, assentos e checkout serão fictícios e determinísticos. Não haverá conexão com sistemas de pagamento, emissão de bilhetes, login ou dados reais de passageiros.",
)
architecture = [
    ("Camada de interface", "Componentes de busca, resultados, filtros, modal de assentos e checkout."),
    ("Camada de acessibilidade", "Semântica HTML, gerenciamento de foco, anúncios de estado e preferências visuais."),
    ("Camada de modos visuais", "Tokens CSS e atributos globais para Padrão, Alto Contraste, Idoso e Combinado, sem duplicar componentes."),
    ("Camada assistiva opcional", "Componente simulado ou ponto de integração com Rybená Web, condicionado a licenciamento."),
    ("Dados simulados", "Rotas, horários, preços, empresas, assentos e mensagens de validação."),
    ("Telemetria acadêmica", "Eventos locais para comparar tarefa-base e tarefa no protótipo."),
]
add_table(doc, ["Camada", "Responsabilidade"], architecture, [2600, 6760], font_size=9.5)

add_heading(doc, "12.1 Eventos mínimos", 2)
events = [
    ("search_started", "Primeiro campo da busca recebe interação."),
    ("search_completed", "Origem, destino e data válidos."),
    ("results_loaded", "Lista de viagens exibida."),
    ("trip_selected", "Usuário escolhe uma viagem."),
    ("seat_selected", "Assento livre é escolhido."),
    ("checkout_started", "Checkout é exibido."),
    ("validation_error", "Campo apresenta erro."),
    ("visual_mode_changed", "Modo Padrão, Alto Contraste, Idoso ou Combinado é ativado, sem registrar idade ou diagnóstico."),
    ("assistive_feature_used", "Recurso assistivo é acionado, sem registrar diagnóstico."),
]
add_table(doc, ["Evento", "Finalidade"], events, [3000, 6360], font_size=9.5)

add_heading(doc, "13. Plano de execução sugerido", 1)
add_table(
    doc,
    ["Fase", "Foco", "Entregáveis"],
    [
        ("Semana 1", "Base e busca", "Componentes-base, navegação por teclado, autocomplete e calendário."),
        ("Semana 2", "Resultados", "Filtros semânticos, cards acessíveis e controle de promoções."),
        ("Semana 3", "Assentos e checkout", "Modal acessível, mapa de assentos, validação e resumo."),
        ("Semana 4", "Modos visuais e testes", "Alto Contraste, modo Idoso, combinação, barra opcional, telemetria e ajustes finais."),
    ],
    [1500, 2700, 5160],
    font_size=9.5,
)

add_heading(doc, "14. Riscos e mitigação", 1)
add_table(
    doc,
    ["Risco", "Impacto", "Mitigação"],
    [
        ("Escopo voltar a crescer", "Atraso e perda de qualidade.", "Manter app, totem e integrações fora do MVP."),
        ("Plugin assistivo causar conflito", "Sobreposição, lentidão ou foco incorreto.", "Validar em cada etapa e manter experiência nativa funcional."),
        ("Modo Idoso simplificar demais", "Perda de informação ou tom infantilizado.", "Ampliar e reorganizar sem remover dados essenciais; validar linguagem com participantes."),
        ("Alto Contraste quebrar a marca", "Inconsistência visual ou estados ilegíveis.", "Usar tokens documentados, contraste medido e versões autorizadas do logotipo."),
        ("Licença Rybená indisponível", "Impossibilidade de usar serviço real.", "Simular a camada no protótipo e documentar o ponto de integração."),
        ("Coleta de informação sensível", "Risco de privacidade.", "Salvar apenas preferências de interface e usar dados fictícios."),
        ("Teste sem público diverso", "Conclusões pouco confiáveis.", "Incluir participantes com perfis e níveis de familiaridade variados."),
        ("Alegação de conformidade", "Expectativa incorreta.", "Usar 'alvo WCAG 2.2 AA' e registrar limites da avaliação."),
    ],
    [2800, 2500, 4060],
    font_size=9.2,
)

add_heading(doc, "15. Entregáveis do MVP", 1)
for item in (
    "Protótipo navegável do site, da busca ao início do checkout.",
    "Versão responsiva para desktop e celular.",
    "Componentes com estados normal, foco, erro, desabilitado, selecionado e carregando.",
    "Variações completas nos modos Padrão, Alto Contraste, Idoso e Combinado.",
    "Barra assistiva opcional e não intrusiva, com alternância dos modos visuais.",
    "Dados fictícios de viagens e assentos.",
    "Roteiro de teste e planilha simples de métricas.",
    "Relatório curto com comparação antes/depois e limitações.",
):
    add_bullet(doc, item, bullet_num_id)

add_heading(doc, "16. Referências técnicas", 1)
references = [
    ("W3C - Visão geral da WCAG 2", "https://www.w3.org/WAI/standards-guidelines/wcag/"),
    ("W3C - Web Content Accessibility Guidelines 2.2", "https://www.w3.org/TR/WCAG22/"),
    ("WAI-ARIA APG - Padrão de combobox", "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/"),
    ("WAI-ARIA APG - Padrão de diálogo modal", "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/"),
    ("W3C WAI - Pessoas idosas e acessibilidade web", "https://www.w3.org/WAI/older-users/"),
    ("W3C - Entendendo contraste mínimo", "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html"),
    ("W3C - Entendendo tamanho mínimo de alvo", "https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html"),
    ("ClickBus - Site público", "https://www.clickbus.com.br/"),
    ("Rybená - Soluções de acessibilidade", "https://rybena.com.br/solucoes/"),
]
for label, url in references:
    p = doc.add_paragraph(style="Body Text")
    p.paragraph_format.space_after = Pt(5)
    add_hyperlink(p, label, url)

add_heading(doc, "17. Critério para iniciar a construção", 1)
add_callout(
    doc,
    "Pronto para prototipar",
    "A construção da simulação pode começar quando a jornada, os quick wins, os quatro estados visuais (Padrão, Alto Contraste, Idoso e Combinado), os requisitos funcionais e os critérios de aceite deste documento forem aprovados. Qualquer nova ideia deve ser registrada como fase futura antes de entrar no MVP.",
)

# Keep headings with the following content and avoid table rows splitting unnecessarily.
for table in doc.tables:
    for row in table.rows:
        tr_pr = row._tr.get_or_add_trPr()
        cant_split = OxmlElement("w:cantSplit")
        tr_pr.append(cant_split)

doc.save(OUTPUT)
print(OUTPUT)
