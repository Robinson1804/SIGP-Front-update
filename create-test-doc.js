const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } = require('docx');
const fs = require('fs');

async function createTestDocument() {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Título principal
        new Paragraph({
          text: "Plan de Trabajo del Proyecto",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),

        // Espacio
        new Paragraph({ text: "" }),

        // Sección 1
        new Paragraph({
          text: "1. Introducción",
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          children: [
            new TextRun("Este documento describe el plan de trabajo para el desarrollo del proyecto. "),
            new TextRun({ text: "El objetivo principal ", bold: true }),
            new TextRun("es establecer las actividades, recursos y cronograma necesarios para cumplir con los entregables definidos."),
          ],
        }),

        // Espacio
        new Paragraph({ text: "" }),

        // Sección 2
        new Paragraph({
          text: "2. Objetivos del Proyecto",
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: "Los objetivos específicos del proyecto son:",
        }),
        new Paragraph({
          text: "• Analizar los requerimientos del sistema",
          bullet: { level: 0 },
        }),
        new Paragraph({
          text: "• Diseñar la arquitectura de la solución",
          bullet: { level: 0 },
        }),
        new Paragraph({
          text: "• Implementar los módulos principales",
          bullet: { level: 0 },
        }),
        new Paragraph({
          text: "• Realizar pruebas de calidad",
          bullet: { level: 0 },
        }),
        new Paragraph({
          text: "• Desplegar en ambiente de producción",
          bullet: { level: 0 },
        }),

        // Espacio
        new Paragraph({ text: "" }),

        // Sección 3
        new Paragraph({
          text: "3. Alcance",
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          children: [
            new TextRun("El proyecto contempla el desarrollo de un "),
            new TextRun({ text: "Sistema de Gestión de Proyectos", italics: true }),
            new TextRun(" que permitirá a la organización administrar sus iniciativas de manera eficiente, incluyendo:"),
          ],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "- Gestión de proyectos y actividades" }),
        new Paragraph({ text: "- Control de documentos y actas" }),
        new Paragraph({ text: "- Seguimiento de cronogramas" }),
        new Paragraph({ text: "- Reportes y dashboards" }),

        // Espacio
        new Paragraph({ text: "" }),

        // Sección 4
        new Paragraph({
          text: "4. Cronograma",
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: "El proyecto se desarrollará en las siguientes fases:",
        }),
        new Paragraph({ text: "" }),

        // Tabla simple
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "Fase", bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Duración", bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Estado", bold: true })] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Análisis")] }),
                new TableCell({ children: [new Paragraph("2 semanas")] }),
                new TableCell({ children: [new Paragraph("Completado")] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Diseño")] }),
                new TableCell({ children: [new Paragraph("3 semanas")] }),
                new TableCell({ children: [new Paragraph("En progreso")] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Desarrollo")] }),
                new TableCell({ children: [new Paragraph("8 semanas")] }),
                new TableCell({ children: [new Paragraph("Pendiente")] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Pruebas")] }),
                new TableCell({ children: [new Paragraph("2 semanas")] }),
                new TableCell({ children: [new Paragraph("Pendiente")] }),
              ],
            }),
          ],
        }),

        // Espacio
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),

        // Sección final
        new Paragraph({
          text: "5. Conclusión",
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          children: [
            new TextRun("Este plan de trabajo será la guía para el desarrollo del proyecto. "),
            new TextRun({ text: "Se realizarán revisiones periódicas ", bold: true }),
            new TextRun("para asegurar el cumplimiento de los objetivos establecidos."),
          ],
        }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync('E:\\Sistema de Gestion de Proyectos\\test-plan-trabajo.docx', buffer);
  console.log('Documento creado: test-plan-trabajo.docx');
}

createTestDocument().catch(console.error);
