/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageOrientation, convertInchesToTwip, ImageRun, AlignmentType, PageBreak, Footer, PageNumber, TableOfContents } from 'docx';
import JSZip from 'jszip';
import { 
    HistoryItem, DayPlan, YoutubeShortScript, InstagramReelsScript, TrendIdea, 
    GeneratedVisuals, EbookContent, VideoData
} from './types';

// --- HELPER FUNCTIONS ---
export const slugify = (text: string) => text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

export const createAdvancedVeoStylePrompt = (basePrompt: string): string => {
    return `Masterpiece cinematic shot, hyperrealistic, 8k, professional color grading, dynamic motion. Style of a high-budget film. ${basePrompt}. Use dramatic lighting like golden hour or moody backlighting. Add subtle lens flare or atmospheric particles (dust, mist). Focus on photorealistic textures. Aspect ratio 9:16.`;
};

export const createInstagramReelsVisualPrompt = (script: InstagramReelsScript, theme: string, target_audience: string): string => {
    const coreConcept = script.hook;
    const visualElements = script.scenes.map(s => 
        s.visual_description
         .replace(/9:16 aspect ratio/ig, '')
         .replace(/vertical/ig, '')
         .trim()
    ).join(", ");
    const keyIdeas = script.scenes.map(s => s.on_screen_text).join(", ");

    let stylePersona = "a modern, clean, and professional aesthetic.";
    if (target_audience.toLowerCase().includes('gen z') || target_audience.toLowerCase().includes('muda')) {
        stylePersona = "an aesthetic that is cinematic and trendy, using moody, dramatic lighting and a slightly grainy film look. Think high-end social media content creator visual.";
    } else if (target_audience.toLowerCase().includes('profesional')) {
        stylePersona = "a sleek, sophisticated, and minimalist aesthetic, focusing on abstract concepts and a professional, high-contrast color palette.";
    }

    const prompt = `
    Create a single, visually stunning, vertical (9:16) masterpiece image. This image will serve as a symbolic background visual for an Instagram Reel.
    Crucially, the image must be purely visual. It should NOT be an infographic.
    **ABSOLUTELY DO NOT include any text, words, letters, or numbers in the image.** The focus is 100% on the artistic, photographic quality.

    - **Core Theme:** "${theme}"
    - **Visual Metaphor:** The image must be a powerful, symbolic representation of the idea: "${coreConcept}". It should also evoke the concepts of: "${keyIdeas}".
    - **Aesthetic Inspiration:** Draw inspiration from these visual descriptions: "${visualElements}".
    - **Style Persona:** The overall mood must align with ${stylePersona}

    **Final Technical Requirements:**
    - Photorealistic, hyper-detailed, 8K resolution.
    - Vertical 9:16 aspect ratio.
    - No text.
    `;
    
    return prompt.trim();
};

export const exportVideoAssetsToZip = async (videoData: VideoData) => {
    const zip = new JSZip();

    // 1. Create a detailed script file for video editors
    const scriptContent = [
        `Title: ${videoData.script.title}`,
        `\nHook: ${videoData.script.hook}\n`,
        '------------------',
        'SCRIPT & VISUALS',
        '------------------',
        ...videoData.script.scenes.map((scene, index) => 
            `\n[SCENE ${String(index + 1).padStart(2, '0')}] - (Image File: scene_${String(index + 1).padStart(2, '0')}.jpg)\n\n` +
            `VOICEOVER:\n${scene.voiceover_narration}\n\n` +
            `ON-SCREEN TEXT:\n${scene.on_screen_text}\n\n` +
            `VISUAL GUIDE / PROMPT:\n${scene.visual_description}`
        ),
        '\n------------------',
        '\nSUGGESTIONS\n',
        `Music: ${videoData.script.music_suggestion}`,
        `CTA: ${videoData.script.cta}`
    ].join('\n');

    zip.file("script.txt", scriptContent);

    // 2. Create images/ folder and add images
    const imgFolder = zip.folder("images");
    if (imgFolder) {
        // Fetch and add each image to the zip
        const imagePromises = videoData.scene_images.map(async (sceneImage, index) => {
            const response = await fetch(sceneImage.imageUrl);
            const blob = await response.blob();
            // Pad index for correct file ordering (e.g., scene_01.jpg, scene_02.jpg)
            const paddedIndex = String(index + 1).padStart(2, '0');
            imgFolder.file(`scene_${paddedIndex}.jpg`, blob);
        });
        await Promise.all(imagePromises);
    }

    // 3. Generate and trigger download of the zip file
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slugify(videoData.script.title || 'video-assets')}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const exportToDocx = async (item: HistoryItem<any, any>) => {
    const commonSpacing = { after: 200, before: 0 };
    const headingSpacing = { after: 240, before: 120 };

    let children: Paragraph[] = [
      new Paragraph({ text: item.title, heading: HeadingLevel.TITLE, spacing: { after: 400 } })
    ];
    
    if (item.type === 'plan' && item.data.plan) {
        item.data.plan.forEach((day: DayPlan) => {
            children.push(new Paragraph({ text: `Day ${day.day}: ${day.theme}`, heading: HeadingLevel.HEADING_1, spacing: headingSpacing }));
            children.push(new Paragraph({ text: day.content_idea, heading: HeadingLevel.HEADING_2, spacing: commonSpacing }));
            children.push(new Paragraph({ text: "Caption", heading: HeadingLevel.HEADING_3, spacing: headingSpacing }));
            children.push(new Paragraph({ text: day.caption, spacing: commonSpacing }));
            children.push(new Paragraph({ text: "Visual Idea", heading: HeadingLevel.HEADING_3, spacing: headingSpacing }));
            children.push(new Paragraph({ text: day.visual_idea, spacing: commonSpacing }));
            children.push(new Paragraph({ text: "Hashtags", heading: HeadingLevel.HEADING_3, spacing: headingSpacing }));
            children.push(new Paragraph({ text: day.hashtags.join(' '), spacing: commonSpacing }));
            children.push(new Paragraph({ text: "", spacing: { after: 400 } })); // Spacer
        });
    } else if (item.type === 'youtube') {
        const script: YoutubeShortScript = item.data?.script || item.data; // Handle both direct script and generated video
        if (!script || !script.scenes) {
            children.push(new Paragraph({text: "Error: Script data is invalid or missing."}));
        } else {
            children.push(new Paragraph({ text: `Title: ${script.title}`, heading: HeadingLevel.HEADING_1, spacing: headingSpacing }));
            children.push(new Paragraph({ text: `Hook: ${script.hook}`, heading: HeadingLevel.HEADING_2, spacing: commonSpacing }));
            script.scenes.forEach(scene => {
                children.push(new Paragraph({ text: `Scene ${scene.scene_number}`, heading: HeadingLevel.HEADING_3, spacing: headingSpacing }));
                children.push(new Paragraph({ text: `Visual: ${scene.visual_description}`, spacing: commonSpacing }));
                children.push(new Paragraph({ text: `Narasi: ${scene.voiceover_narration}`, spacing: commonSpacing }));
                children.push(new Paragraph({ text: `Teks Layar: ${scene.on_screen_text}`, spacing: commonSpacing }));
            });
            children.push(new Paragraph({ text: `Music: ${script.music_suggestion}`, heading: HeadingLevel.HEADING_2, spacing: headingSpacing }));
            children.push(new Paragraph({ text: `CTA: ${script.cta}`, heading: HeadingLevel.HEADING_2, spacing: headingSpacing }));
        }
    } else if (item.type === 'instagram') {
        const script: InstagramReelsScript = item.data?.script || item.data; // Handle both direct script and generated visual
        if (!script || !script.scenes) {
             children.push(new Paragraph({text: "Error: Script data is invalid or missing."}));
        } else {
            children.push(new Paragraph({ text: `Hook: ${script.hook}`, heading: HeadingLevel.HEADING_1, spacing: headingSpacing }));
            children.push(new Paragraph({ text: `Audio Suggestion: ${script.audio_suggestion}`, heading: HeadingLevel.HEADING_2, spacing: commonSpacing }));
            script.scenes.forEach(scene => {
                children.push(new Paragraph({ text: `Scene ${scene.scene_number}`, heading: HeadingLevel.HEADING_3, spacing: headingSpacing }));
                children.push(new Paragraph({ text: `Visual: ${scene.visual_description}`, spacing: commonSpacing }));
                children.push(new Paragraph({ text: `Narasi: ${scene.voiceover_narration}`, spacing: commonSpacing }));
                children.push(new Paragraph({ text: `Teks Layar: ${scene.on_screen_text}`, spacing: commonSpacing }));
            });
            children.push(new Paragraph({ text: `Hashtags: ${script.hashtags.join(' ')}`, heading: HeadingLevel.HEADING_2, spacing: headingSpacing }));
            children.push(new Paragraph({ text: `CTA: ${script.cta}`, heading: HeadingLevel.HEADING_2, spacing: headingSpacing }));
        }
    } else if (item.type === 'trend' && item.data.ideas) {
        item.data.ideas.forEach((idea: TrendIdea) => {
            children.push(new Paragraph({ text: idea.trend_name, heading: HeadingLevel.HEADING_1, spacing: headingSpacing }));
            children.push(new Paragraph({ text: "Why it's Viral", heading: HeadingLevel.HEADING_2, spacing: commonSpacing }));
            children.push(new Paragraph({ text: idea.fyp_potential_reason, spacing: commonSpacing }));
            children.push(new Paragraph({ text: "Fused Idea", heading: HeadingLevel.HEADING_2, spacing: commonSpacing }));
            children.push(new Paragraph({ text: idea.fused_idea_title, heading: HeadingLevel.HEADING_3, spacing: commonSpacing }));
            children.push(new Paragraph({ text: idea.content_angle, spacing: commonSpacing }));
            children.push(new Paragraph({ text: "", spacing: { after: 400 } })); // Spacer
        });
    }
    
    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    size: {
                        width: 11906, // A4 width in twips
                        height: 16838, // A4 height in twips
                        orientation: PageOrientation.PORTRAIT,
                    },
                    margin: {
                        top: convertInchesToTwip(1),
                        right: convertInchesToTwip(1),
                        bottom: convertInchesToTwip(1),
                        left: convertInchesToTwip(1),
                    },
                }
            },
            children
        }]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slugify(item.title)}.docx`;
    a.click();
    URL.revokeObjectURL(url);
};

export const exportToPdf = (item: HistoryItem<any, any>) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - (margin * 2);
    let y = margin + 10;

    const checkPageEnd = (neededHeight: number) => {
        if (y + neededHeight > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            y = margin;
        }
    };
    
    const addText = (text: string, size: number, style: 'bold' | 'normal' | 'italic' = 'normal') => {
        doc.setFontSize(size);
        doc.setFont('helvetica', style);
        const lines = doc.splitTextToSize(text, usableWidth);
        checkPageEnd(lines.length * (size * 0.4));
        doc.text(lines, margin, y);
        y += (lines.length * (size * 0.4)) + (size * 0.3);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    checkPageEnd(10);
    doc.text(item.title, margin, y);
    y += 15;

    if (item.type === 'plan' && item.data.plan) {
        item.data.plan.forEach((day: DayPlan) => {
            addText(`Day ${day.day}: ${day.theme}`, 14, 'bold');
            addText(day.content_idea, 12, 'italic');
            addText(`Caption: ${day.caption}`, 11);
            addText(`Hashtags: ${day.hashtags.join(' ')}`, 11);
            y += 10;
        });
    } else if (item.type === 'youtube') {
        const script: YoutubeShortScript = item.data.script || item.data;
        addText(`Title: ${script.title}`, 14, 'bold');
        addText(`Hook: ${script.hook}`, 12, 'italic');
        y += 5;
        script.scenes.forEach(scene => {
            addText(`Scene ${scene.scene_number}`, 12, 'bold');
            addText(`Visual: ${scene.visual_description}`, 10);
            addText(`Narasi: ${scene.voiceover_narration}`, 10);
            addText(`Teks Layar: ${scene.on_screen_text}`, 10);
            y += 3;
        });
    } else if (item.type === 'instagram') {
        const script: InstagramReelsScript = item.data.script || item.data;
        addText(`Hook: ${script.hook}`, 14, 'bold');
        addText(`Audio Suggestion: ${script.audio_suggestion}`, 12, 'italic');
        y += 5;
        script.scenes.forEach(scene => {
            addText(`Scene ${scene.scene_number}`, 12, 'bold');
            addText(`Visual: ${scene.visual_description}`, 10);
            addText(`Narasi: ${scene.voiceover_narration}`, 10);
            addText(`Teks Layar: ${scene.on_screen_text}`, 10);
            y += 3;
        });
        addText(`Hashtags: ${script.hashtags.join(' ')}`, 11);
        addText(`CTA: ${script.cta}`, 11, 'bold');
    } else if (item.type === 'trend' && item.data.ideas) {
        item.data.ideas.forEach((idea: TrendIdea) => {
            addText(idea.trend_name, 14, 'bold');
            addText("Why it's Viral", 12, 'bold');
            addText(idea.fyp_potential_reason, 11);
            addText("Fused Idea", 12, 'bold');
            addText(idea.fused_idea_title, 11, 'italic');
            addText(idea.content_angle, 11);
            y += 10;
        });
    }
    doc.save(`${slugify(item.title)}.pdf`);
};

export const exportDailyReportToDocx = async (dayData: DayPlan, visualData: GeneratedVisuals, ebookContent: EbookContent) => {
    // 1. Get Cover Image from the ebookContent object
    const coverImageBase64: string | null = ebookContent.cover.imageBase64 || null;

    // 2. Process Chapter Images
    const chapterImageB64s = (visualData.visuals || []).map(v => {
        const parts = v.imageUrl.split(',');
        if (parts.length === 2 && parts[0].startsWith('data:image/')) {
            return parts[1];
        }
        return null;
    }).filter((b): b is string => b !== null);

    if (chapterImageB64s.length !== (visualData.visuals || []).length) {
        console.warn("Beberapa gambar bab tidak dapat diproses dan akan dilewati.");
    }

    // A4 page is 8.27 inches wide. Margins are 1 inch each side.
    const USABLE_WIDTH_INCHES = 8.27 - 2; 
    const imageWidthInPixels = USABLE_WIDTH_INCHES * 96;
    
    // 3. Prepare Media using ImageRun (conditionally)
    const chapterImages = chapterImageB64s.map(b64 => new ImageRun({
        data: b64,
        transformation: {
            width: Math.round(imageWidthInPixels * 0.7), // Use 70% of usable width for chapter images
            height: Math.round(imageWidthInPixels * 0.7), // Maintain 1:1 aspect ratio
        },
    } as any));

    // 4. Build Document Content
    let docChildren: (Paragraph | TableOfContents)[] = [];

    // Cover Page
    docChildren.push(new Paragraph({ style: "Title", text: ebookContent.cover.title }));
    docChildren.push(new Paragraph({ style: "Subtitle", text: ebookContent.cover.subtitle }));
    if (coverImageBase64) {
        const coverImage = new ImageRun({
            data: coverImageBase64,
            transformation: {
                width: Math.round(imageWidthInPixels * 0.8),
                height: Math.round((imageWidthInPixels * 0.8) * (4 / 3)),
            },
        } as any);
        docChildren.push(new Paragraph({
            children: [coverImage],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 }
        }));
    }
    docChildren.push(new Paragraph({ children: [new PageBreak()] }));

    // Disclaimer Page
    docChildren.push(new Paragraph({ style: "Heading1", text: "Disclaimer" }));
    ebookContent.disclaimer.split('\n').filter(line => line.trim() !== '').forEach(line =>
        docChildren.push(new Paragraph({ style: "BodyText", text: line }))
    );
    docChildren.push(new Paragraph({ text: "" })); // Spacer
    docChildren.push(new Paragraph({ style: "Heading2", text: "Nota InMyOpinion-ID" }));
    ebookContent.inmyopinion_note.split('\n').filter(line => line.trim() !== '').forEach(line =>
        docChildren.push(new Paragraph({ style: "BodyText", text: line }))
    );
    docChildren.push(new Paragraph({ children: [new PageBreak()] }));
    
    // Table of Contents
    docChildren.push(new Paragraph({ style: "Heading1", text: ebookContent.table_of_contents_title }));
    docChildren.push(new TableOfContents("", { hyperlink: true }));
    docChildren.push(new Paragraph({ children: [new PageBreak()] }));

    // Introduction
    docChildren.push(new Paragraph({ style: "Heading1", text: "Pendahuluan" }));
    ebookContent.introduction.split('\n').filter(line => line.trim() !== '').forEach(line =>
        docChildren.push(new Paragraph({ style: "BodyText", text: line }))
    );
    docChildren.push(new Paragraph({ text: "" })); // Spacer

    // Chapters with inline images and quotes
    ebookContent.chapters.forEach((chapter) => {
        docChildren.push(new Paragraph({ style: "Heading1", text: chapter.heading }));

        const contentParts = chapter.content.split(/(\[IMAGE_\d+\])/g);

        contentParts.forEach(part => {
            const match = part.match(/\[IMAGE_(\d+)\]/);
            if (match) {
                const imageIndex = parseInt(match[1], 10) - 1;
                if (imageIndex >= 0 && imageIndex < chapterImages.length) {
                    docChildren.push(new Paragraph({
                        children: [chapterImages[imageIndex]],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200, after: 200 }
                    }));
                } else {
                    docChildren.push(new Paragraph({ style: "BodyText", text: `[Gambar ${imageIndex + 1} tidak tersedia]` }));
                }
            } else if (part.trim()) {
                part.trim().split('\n').filter(line => line.trim() !== '').forEach(line => {
                    if (line.trim().startsWith('>')) {
                        docChildren.push(new Paragraph({
                            style: "Quote",
                            text: line.trim().substring(1).trim()
                        }));
                    } else {
                        docChildren.push(new Paragraph({ style: "BodyText", text: line }));
                    }
                });
            }
        });
        docChildren.push(new Paragraph({ text: "" })); // Spacer
    });

    // Conclusion
    docChildren.push(new Paragraph({ style: "Heading1", text: "Penutup" }));
    ebookContent.conclusion.split('\n').filter(line => line.trim() !== '').forEach(line =>
        docChildren.push(new Paragraph({ style: "BodyText", text: line }))
    );

    // 5. Create Document with everything
    const doc = new Document({
        creator: "Creator AI",
        title: ebookContent.cover.title,
        description: `E-book for Day ${dayData.day}: ${dayData.theme}`,
        styles: {
            default: {
                document: { run: { font: "Calibri", size: 22 } }, // 11pt
            },
            paragraphStyles: [
                { id: "Title", name: "Title", basedOn: "Normal", next: "Normal", run: { size: 52, bold: true, color: "8A2BE2" }, paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 300 } } },
                { id: "Subtitle", name: "Subtitle", basedOn: "Normal", next: "Normal", run: { size: 28, italics: true, color: "555555" }, paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 600 } } },
                { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", run: { size: 32, bold: true, color: "9932CC" }, paragraph: { spacing: { before: 480, after: 240 } } },
                { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", run: { size: 28, bold: true, color: "9932CC" }, paragraph: { spacing: { before: 360, after: 180 } } },
                { id: "BodyText", name: "Body Text", basedOn: "Normal", next: "Normal", paragraph: { alignment: AlignmentType.JUSTIFIED, spacing: { after: 120 } } },
                { id: "Quote", name: "Quote", basedOn: "Normal", next: "Normal", run: { size: 22, italics: true, color: "444444" }, paragraph: { alignment: AlignmentType.JUSTIFIED, indent: { left: 720, right: 720 }, spacing: { before: 240, after: 240 } } },
            ]
        },
        sections: [{
            properties: { 
                page: { 
                    size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT }, // A4 dimensions in twips
                    margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } // 1 inch margins in twips
                } 
            },
            footers: {
                default: new Footer({
                    children: [ new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ children: [PageNumber.CURRENT] }) ] }) ],
                }),
            },
            children: docChildren,
        }],
    });
    
    // 6. Pack and Download
    try {
        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${slugify(`ebook-${dayData.day}-${dayData.theme}`)}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (packerError) {
        console.error("Docx Packer Error:", packerError);
        throw new Error("Gagal saat mengemas file .docx. Periksa konsol untuk detailnya.");
    }
};
