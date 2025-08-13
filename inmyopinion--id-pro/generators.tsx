
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useCallback, FormEvent, useEffect, useRef, useMemo } from 'react';
import { 
    DayPlan, PlanInputs, PlanData, DailyArtifacts, VisualConceptsResponse, GeneratedVisuals, EbookContent, 
    PerformanceMetrics, YoutubeShortScript, VideoData, YoutubeScene, InstagramReelsScript, InstagramReelScene,
    GeneratedVisualData, TrendIdea, TrendFusionResponse, MultiplierResponse, GrowthInsight, PerformanceAnalysisResponse,
    PromptStudioResponse, PromptStudioInputs, HistoryItem, GeneratedYoutubeVideo, TabType, TrendFusionInputs, KnowledgeSource,
    MultiplierResult, BlogArticle, InstagramCarouselSlide, TwitterThreadTweet, ChannelAuditInputs
} from './types';
import { 
    callCreatorAi, visualConceptsSchema, ebookContentSchema, generateImage
} from './api';
import { useApiMutation } from './hooks';
import { 
    ActionButtons, CopyButton, DownloadButton, LoadingSpinner, ErrorMessage, PromptStudioPlaceholder, 
    CollapsibleText, VoiceOverPlayer, WordIcon, BookIcon, ChartIcon, InfoIcon, EditIcon, PinIcon, PdfIcon,
    PlayIcon, PauseIcon, RestartIcon, DownloadVideoIcon, YoutubeIcon, ReelsIcon, TrendIcon, MultiplyIcon,
    AnalyzerIcon, SparklesIcon, PlanIcon, DashboardIcon, UploadCloudIcon, FileTextIcon, TrashIcon, BrainCircuitIcon,
    CloseIcon, LineChartIcon
} from './components';
import { BarChart, LineChart } from './charts';
import { exportDailyReportToDocx, slugify } from './lib';

const KnowledgeSourceSelector = ({ 
    knowledgeSources, 
    selectedKnowledgeSourceId, 
    onSelectKnowledgeSource, 
    disabled,
    showLabel = true,
}: {
    knowledgeSources: KnowledgeSource[];
    selectedKnowledgeSourceId: string | null;
    onSelectKnowledgeSource: (id: string | null) => void;
    disabled: boolean;
    showLabel?: boolean;
}) => {
    return (
        <div className="source-selector-container">
            <div className="form-group">
                {showLabel && (
                    <label htmlFor="knowledge_source_selector">
                        <BrainCircuitIcon /> Tarik Ide dari Sumber Pengetahuan
                        <span className="form-label-hint">(Opsional)</span>
                    </label>
                )}
                <select
                    id="knowledge_source_selector"
                    className="source-plan-selector"
                    value={selectedKnowledgeSourceId || ''}
                    onChange={(e) => onSelectKnowledgeSource(e.target.value || null)}
                    disabled={disabled || knowledgeSources.length === 0}
                >
                    <option value="">-- Pengetahuan Umum AI --</option>
                    {knowledgeSources.filter(s => s.status === 'ready').map(source => (
                        <option key={source.id} value={source.id}>
                            {source.name}
                        </option>
                    ))}
                </select>
                {knowledgeSources.length === 0 && (
                     <div className="empty-source-plan-message">
                        Tidak ada sumber pengetahuan. Unggah file di tab Pusat Pengetahuan.
                    </div>
                )}
            </div>
        </div>
    );
};


const SourcePlanSelector = ({ allPlans, selectedPlanId, onSelectPlan, disabled }: {
    allPlans: HistoryItem<PlanInputs, PlanData>[];
    selectedPlanId: string | null;
    onSelectPlan: (id: string) => void;
    disabled: boolean;
}) => {
    return (
        <div className="source-selector-container">
            <div className="form-group">
                <label htmlFor="source_plan_selector">
                    <PlanIcon /> Rencana Konten Sumber
                    <span className="form-label-hint">(Opsional jika mengisi manual)</span>
                </label>
                {allPlans.length === 0 ? (
                     <div className="empty-source-plan-message">
                        Tidak ada rencana konten. Silakan buat di tab Content Plan.
                    </div>
                ) : (
                    <select
                        id="source_plan_selector"
                        className="source-plan-selector"
                        value={selectedPlanId || ''}
                        onChange={(e) => onSelectPlan(e.target.value)}
                        disabled={disabled}
                    >
                        <option value="">-- Pilih Rencana Konten --</option>
                        {allPlans.map(plan => (
                            <option key={plan.id} value={plan.id}>
                                {plan.title} ({new Date(plan.timestamp).toLocaleDateString()})
                            </option>
                        ))}
                    </select>
                )}
            </div>
        </div>
    );
};

const PreviewModal = ({ isOpen, onClose, onDownload, title, children, isLoading, downloadError }: { isOpen: boolean, onClose: () => void, onDownload: () => void, title: string, children: React.ReactNode, isLoading: boolean, downloadError: string }) => {
    if (!isOpen) return null;
    return (
        <div className={`modal-overlay ${isOpen ? 'visible' : ''}`} onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button onClick={onClose} className="modal-close-button">&times;</button>
                </div>
                <div className="modal-body">{children}</div>
                <div className="modal-footer">
                    {downloadError && <ErrorMessage message={downloadError}/>}
                    <button onClick={onClose} className="button-secondary">Tutup</button>
                    <button onClick={onDownload} className="button-primary" disabled={isLoading}>
                         {isLoading ? 'Menyiapkan...' : <><WordIcon/> Unduh .docx</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

const PerformanceMetricsModal = ({ isOpen, onClose, onSave, initialMetrics }: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (metrics: PerformanceMetrics) => void;
    initialMetrics?: PerformanceMetrics;
}) => {
    const [metrics, setMetrics] = useState<PerformanceMetrics>(
        initialMetrics || { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 }
    );

    useEffect(() => {
        setMetrics(initialMetrics || { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 });
    }, [initialMetrics, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setMetrics(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(metrics);
        onClose();
    };

    return (
        <div className={`modal-overlay ${isOpen ? 'visible' : ''}`} onClick={onClose}>
            <div className="modal-content performance-modal-content" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="modal-header">
                        <h2>Input Performance Metrics</h2>
                        <button type="button" onClick={onClose} className="modal-close-button">&times;</button>
                    </div>
                    <div className="modal-body">
                        <div className="metrics-form-grid">
                            {Object.keys(metrics).map(key => (
                                <div className="form-group" key={key}>
                                    <label htmlFor={`metric-${key}`}>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                                    <input
                                        type="number"
                                        id={`metric-${key}`}
                                        name={key}
                                        value={metrics[key as keyof PerformanceMetrics]}
                                        onChange={handleChange}
                                        min="0"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="button-secondary">Cancel</button>
                        <button type="submit" className="button-primary">Save Metrics</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- FORM & RESULT COMPONENTS ---
const DayCard = ({ day, planInputs, planId, dailyArtifacts, onUpdateArtifact }: { day: DayPlan; planInputs: Partial<PlanInputs>; planId: string | null; dailyArtifacts?: DailyArtifacts; onUpdateArtifact: (planId: string, dayNumber: number, artifactKey: keyof DailyArtifacts, data: any) => void; }) => {
    const [isEbookModalOpen, setIsEbookModalOpen] = useState(false);
    const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState('');

    const generateVisualApi = useCallback(async (visual_idea: string, sourceDocumentContent: string | null) => {
        const conceptsResponse = await callCreatorAi<VisualConceptsResponse>({ function_name: "generateVisualConcepts", visual_idea }, visualConceptsSchema, sourceDocumentContent);
        if (!conceptsResponse.concepts || conceptsResponse.concepts.length === 0) throw new Error("AI did not return visual concepts.");

        const imageGenerationPromises = conceptsResponse.concepts.map(concept =>
            generateImage(concept.image_prompt, { aspectRatio: '1:1' })
        );
        const imageResults = await Promise.all(imageGenerationPromises);

        const visuals = imageResults.map((result, index) => {
            if (!result.generatedImages || result.generatedImages.length === 0) throw new Error(`Image generation failed for concept ${index + 1}`);
            return { imageUrl: `data:image/jpeg;base64,${result.generatedImages[0].image.imageBytes}`, prompt: conceptsResponse.concepts[index].image_prompt };
        });

        return { visuals };
    }, []);
    const visualMutation = useApiMutation<GeneratedVisuals, string>(generateVisualApi);

    const reportMutation = useApiMutation<EbookContent, { theme: string; content_idea: string; target_audience: string; visual_references: string[]; }>(
        (variables, sourceDocumentContent) => callCreatorAi({ function_name: "generateEbookContent", ...variables }, ebookContentSchema, sourceDocumentContent)
    );
    const { setData: setReportData } = reportMutation;

    const visualsData = visualMutation.data || dailyArtifacts?.visuals;
    const ebookData = reportMutation.data || dailyArtifacts?.ebook;
    
    const triggerEbookGeneration = useCallback((visualsForReport?: GeneratedVisuals) => {
        const visual_references = visualsForReport?.visuals.map(v => v.prompt) || [];
        
        // Start the mutation for the text part of the ebook
        reportMutation.mutate({
            theme: day.theme,
            content_idea: day.content_idea,
            target_audience: planInputs.target_audience || "General Audience",
            visual_references,
        }, async (newEbook) => { // The onSuccess callback
            try {
                // Now generate the cover image using the prompt from the ebook data
                const coverImageResponse = await generateImage(newEbook.cover.image_prompt, { aspectRatio: '3:4' });
    
                const imageBase64 = coverImageResponse.generatedImages?.[0]?.image?.imageBytes;
    
                // Combine the generated image with the ebook text data
                const finalEbookData: EbookContent = {
                    ...newEbook,
                    cover: {
                        ...newEbook.cover,
                        imageBase64: imageBase64 // Can be undefined, that's fine
                    }
                };
                
                // Save the complete data (text + image) to the history artifact
                if (planId) {
                    onUpdateArtifact(planId, day.day, 'ebook', finalEbookData);
                }
                setIsEbookModalOpen(true);
            } catch (imageError) {
                console.error("Failed to generate cover image during ebook creation:", imageError);
                // Even if the image fails, save the text part
                if (planId) {
                    onUpdateArtifact(planId, day.day, 'ebook', newEbook);
                }
                setIsEbookModalOpen(true); // Open the modal anyway with just the text
            }
        });
    }, [reportMutation, day, planInputs.target_audience, planId, onUpdateArtifact]);
    
    const handleGenerateVisual = useCallback(() => {
        setReportData(null);
        visualMutation.mutate(day.visual_idea, (newVisuals) => {
            if (planId) {
                onUpdateArtifact(planId, day.day, 'visuals', newVisuals);
            }
        });
    }, [visualMutation, day.visual_idea, setReportData, planId, day.day, onUpdateArtifact]);

    const handleCreateReport = useCallback(() => {
        // This is for the manual button. It uses visuals from state if they exist.
        triggerEbookGeneration(visualsData);
    }, [triggerEbookGeneration, visualsData]);
    
    const handleDownloadReport = useCallback(async () => {
        if (downloading || !ebookData) return;
        setDownloadError('');
        setDownloading(true);
        try {
            // Pass visuals if they exist, otherwise an empty structure to prevent crashes.
            const visualsToExport = visualsData || { visuals: [] };
            await exportDailyReportToDocx(day, visualsToExport, ebookData);
            setIsEbookModalOpen(false);
        } catch (error) {
            console.error("Failed to generate DOCX file:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setDownloadError(`Gagal membuat file .docx. Silakan coba lagi. (${errorMessage})`);
        } finally {
            setDownloading(false);
        }
    }, [day, visualsData, ebookData, downloading]);

    const handleToggleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (planId) {
            onUpdateArtifact(planId, day.day, 'uploaded', e.target.checked);
        }
    };

    const handleSaveMetrics = (metrics: PerformanceMetrics) => {
        if (planId) {
            onUpdateArtifact(planId, day.day, 'metrics', metrics);
        }
    };

    return (
        <>
            <div className={`day-card ${dailyArtifacts?.uploaded ? 'uploaded' : ''}`}>
                 <div className="day-card-header">
                    <h3>Day {day.day}: {day.theme}</h3>
                    <div className="upload-checklist">
                        <input 
                            type="checkbox" 
                            id={`uploaded-${day.day}`} 
                            checked={dailyArtifacts?.uploaded ?? false}
                            onChange={handleToggleUpload}
                        />
                        <label htmlFor={`uploaded-${day.day}`}>Uploaded</label>
                    </div>
                </div>
                <h4>{day.content_idea}</h4>
                
                <div className="day-card-section">
                    <h5 className="section-heading">VISUAL IDEA</h5>
                     <div className="visual-idea-box">
                        <p>{day.visual_idea}</p>
                    </div>
                     <button onClick={handleGenerateVisual} className="generate-visual-button" disabled={visualMutation.loading}>
                        <span className="button-text"><SparklesIcon/> Generate 4 Visuals</span>
                        {visualMutation.loading && <div className="button-progress" style={{ width: `${visualMutation.progress}%` }}></div>}
                        {visualMutation.loading && <span className="button-progress-text">{`${Math.round(visualMutation.progress)}%`}</span>}
                    </button>
                    <div className="rate-limit-info">
                        <InfoIcon />
                        <span>Tips: Generating multiple images in a short time may trigger API rate limits. Please wait a moment between requests.</span>
                    </div>
                    {visualMutation.loading && <div className="card-loader"><LoadingSpinner /></div>}
                    {visualMutation.error && <ErrorMessage message={visualMutation.error} />}
                </div>

                <div className="day-card-section">
                    <h5 className="section-heading">CAPTION</h5>
                    <CollapsibleText text={day.caption} maxLength={150} />
                    <VoiceOverPlayer textToSpeak={day.caption} />
                </div>
                
                <div className="day-card-section">
                    <h5 className="section-heading">HASHTAGS</h5>
                    <p className="hashtags">{day.hashtags.join(' ')}</p>
                </div>
                
                <div className="card-footer-actions">
                     <div className="copy-actions">
                        <CopyButton textToCopy={day.caption} label="Copy Caption" /> 
                        <CopyButton textToCopy={day.hashtags.join(' ')} label="Copy Hashtags" />
                    </div>
                    <div className="main-card-actions">
                        {ebookData && !reportMutation.loading ? (
                            <>
                                <button onClick={() => setIsEbookModalOpen(true)} className="report-button"><BookIcon /> Lihat E-book</button>
                                <button onClick={handleCreateReport} className="regenerate-button" disabled={reportMutation.loading}>
                                    Regenerate
                                </button>
                            </>
                        ) : (
                            <button onClick={handleCreateReport} className="report-button full-width" disabled={reportMutation.loading} title={visualsData ? "Buat e-book dengan visual yang ada" : "Buat e-book tanpa visual"}>
                                {reportMutation.loading ? 'Mempersiapkan...' : <><BookIcon /> Buat E-book Harian</>}
                            </button>
                        )}
                    </div>
                    {dailyArtifacts?.uploaded && (
                        <button onClick={() => setIsMetricsModalOpen(true)} className="add-metrics-button">
                            <ChartIcon /> {dailyArtifacts.metrics ? 'Edit Metrik' : 'Tambahkan Metrik'}
                        </button>
                    )}
                    {reportMutation.error && <ErrorMessage message={reportMutation.error} />}
                </div>
            </div>
            <PreviewModal 
                isOpen={isEbookModalOpen} 
                onClose={() => setIsEbookModalOpen(false)} 
                onDownload={handleDownloadReport}
                title={`Pratinjau E-book: Hari ${day.day}`}
                isLoading={downloading}
                downloadError={downloadError}
            >
               {ebookData && (
                    <div className="preview-content">
                        <div className="preview-section">
                            <h4>Cover</h4>
                            <h3>{ebookData.cover.title}</h3>
                            <p><em>{ebookData.cover.subtitle}</em></p>
                             <p className="preview-prompt"><strong>Prompt Sampul:</strong> {ebookData.cover.image_prompt}</p>
                        </div>
                        
                        <div className="preview-section">
                            <h4>Disclaimer</h4>
                            <p>{ebookData.disclaimer}</p>
                            <h5 className="preview-disclaimer-subtitle">Nota InMyOpinion-ID</h5>
                            <p>{ebookData.inmyopinion_note}</p>
                        </div>

                        <div className="preview-section">
                            <h4>{ebookData.table_of_contents_title}</h4>
                             <ul className="preview-toc">
                                {ebookData.chapters.map((chap, i) => (
                                    <li key={i}>{chap.heading}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="preview-section">
                            <h4>Pendahuluan</h4>
                            <p>{ebookData.introduction}</p>
                        </div>
                        
                        {ebookData.chapters.map((chap, i) => (
                            <div key={i} className="preview-section preview-chapter">
                                <h5>{chap.heading}</h5>
                                <p>
                                    {chap.content.split(/(\[IMAGE_\d+\]|> .*)/g).map((part, index) => {
                                        const imageMatch = part.match(/\[IMAGE_(\d+)\]/);
                                        const quoteMatch = part.startsWith('>');
                                        if (imageMatch) {
                                            const imgIndex = parseInt(imageMatch[1], 10);
                                            return <strong key={index} className="preview-image-placeholder">[ Gambar {imgIndex} akan ditampilkan di sini ]</strong>;
                                        } else if(quoteMatch) {
                                            return <em key={index} className="preview-quote-placeholder">"{part.substring(1).trim()}"</em>
                                        }
                                        return <span key={index}>{part}</span>;
                                    })}
                                </p>
                            </div>
                        ))}

                        <div className="preview-section">
                            <h4>Penutup</h4>
                            <p>{ebookData.conclusion}</p>
                        </div>
                    </div>
                )}
            </PreviewModal>
             <PerformanceMetricsModal
                isOpen={isMetricsModalOpen}
                onClose={() => setIsMetricsModalOpen(false)}
                onSave={handleSaveMetrics}
                initialMetrics={dailyArtifacts?.metrics}
            />
        </>
    );
};

export const ContentPlanGenerator = ({ planData, inputs, onSubmit, onRegenerate, loading, error, progress, planId, onUpdateArtifact, knowledgeSources, selectedKnowledgeSourceId, onSelectKnowledgeSource }: { 
    planData: PlanData | null;
    inputs: Partial<PlanInputs>;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
    onRegenerate: () => void;
    loading: boolean;
    error: string | null;
    progress: number;
    planId: string | null;
    onUpdateArtifact: (planId: string, dayNumber: number, artifactKey: keyof DailyArtifacts, data: any) => void;
    knowledgeSources: KnowledgeSource[];
    selectedKnowledgeSourceId: string | null;
    onSelectKnowledgeSource: (id: string | null) => void;
}) => {
    return (
        <div className="generator-section">
             <KnowledgeSourceSelector 
                knowledgeSources={knowledgeSources}
                selectedKnowledgeSourceId={selectedKnowledgeSourceId}
                onSelectKnowledgeSource={onSelectKnowledgeSource}
                disabled={loading}
            />
            <form onSubmit={onSubmit} className="form">
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="topic">Topic <span className="form-label-hint">(e.g., 'Fakta Unik', 'Psikologi')</span></label>
                        <input type="text" id="topic" name="topic" defaultValue={inputs?.topic || "Psikologi Populer"} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="niche">Niche <span className="form-label-hint">(e.g., 'Sejarah Dunia', 'Kecerdasan Emosional')</span></label>
                        <input type="text" id="niche" name="niche" defaultValue={inputs?.niche || "Kecerdasan Emosional (EQ)"} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="target_audience">Target Audience <span className="form-label-hint">(e.g., 'Mahasiswa', 'Pekerja Kantoran')</span></label>
                        <input type="text" id="target_audience" name="target_audience" defaultValue={inputs?.target_audience || "Profesional Muda (22-30 th)"} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="content_goal">Content Goal <span className="form-label-hint">(e.g., 'Edukasi & Engagement', 'Branding')</span></label>
                        <input type="text" id="content_goal" name="content_goal" defaultValue={inputs?.content_goal || "Meningkatkan Engagement"} required />
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="custom_cta">Custom Call-to-Action <span className="form-label-hint">(e.g., 'Follow untuk info lainnya!', 'Komen pendapatmu!')</span></label>
                    <input type="text" id="custom_cta" name="custom_cta" defaultValue={inputs?.custom_cta || "Bagikan di story dan tag temanmu!"} required />
                </div>
                <div className="form-actions">
                    <button type="submit" className="submit-button" disabled={loading}>
                        <span className="button-text">{loading ? 'Generating...' : 'Generate Plan'}</span>
                        {loading && <div className="button-progress" style={{ width: `${progress}%` }}></div>}
                        {loading && <span className="button-progress-text">{`${Math.round(progress)}%`}</span>}
                    </button>
                    {planData && <button type="button" className="regenerate-button" onClick={onRegenerate} disabled={loading}>Re-generate</button>}
                </div>
            </form>
            <div className="results-container">
                {loading && <LoadingSpinner />}
                {error && <ErrorMessage message={error} />}
                {planData?.plan && <div className="plan-grid">{planData.plan.map((day) => {
                    const dailyArtifacts = planData.daily_artifacts?.[day.day];
                    return <DayCard 
                        key={day.day} 
                        day={day} 
                        planInputs={inputs} 
                        planId={planId}
                        dailyArtifacts={dailyArtifacts}
                        onUpdateArtifact={onUpdateArtifact}
                    />
                })}</div>}
            </div>
        </div>
    );
}

const VideoPreviewPlayer = ({ videoData, onSceneChange, jumpToScene, onJumpComplete }: { 
    videoData: VideoData;
    onSceneChange: (index: number) => void;
    jumpToScene: number | null;
    onJumpComplete: () => void;
}) => {
    const { script, scene_images } = videoData;
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const stopPlayback = useCallback((cancelSpeech = true) => {
        setIsPlaying(false);
        if (cancelSpeech) {
            window.speechSynthesis.cancel();
        }
    }, []);

    const playNextScene = useCallback((sceneIndex: number) => {
        if (sceneIndex >= script.scenes.length + 1) { // +1 for CTA
            stopPlayback(false);
            onSceneChange(script.scenes.length);
            setCurrentSceneIndex(script.scenes.length);
            return;
        }
        
        onSceneChange(sceneIndex);
        setCurrentSceneIndex(sceneIndex);

        const isCtaScene = sceneIndex === script.scenes.length;
        const textToSpeak = isCtaScene ? script.cta : script.scenes[sceneIndex]?.voiceover_narration;
        
        if (!textToSpeak) {
            playNextScene(sceneIndex + 1);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        const indonesianVoice = window.speechSynthesis.getVoices().find(v => v.lang === 'id-ID');
        if (indonesianVoice) utterance.voice = indonesianVoice;
        utteranceRef.current = utterance;
        
        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => playNextScene(sceneIndex + 1);
        utterance.onerror = (e) => {
            if (e.error !== 'interrupted') console.error("SpeechSynthesis Error:", e.error);
            stopPlayback(false);
        };
        window.speechSynthesis.speak(utterance);
    }, [script, stopPlayback, onSceneChange]);
    
    useEffect(() => {
        if (jumpToScene !== null) {
            stopPlayback();
            setTimeout(() => {
                playNextScene(jumpToScene);
                onJumpComplete();
            }, 100);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jumpToScene]);


    const handleTogglePlay = () => {
        if (isPlaying) {
            stopPlayback();
        } else {
            const indexToPlay = currentSceneIndex >= script.scenes.length ? 0 : currentSceneIndex;
            playNextScene(indexToPlay);
        }
    };

    const handleRestart = () => {
        stopPlayback();
        setTimeout(() => playNextScene(0), 100);
    };

    const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        stopPlayback();
        const newIndex = parseInt(e.target.value, 10);
        onSceneChange(newIndex);
        setCurrentSceneIndex(newIndex);
    };

    useEffect(() => {
        return () => stopPlayback();
    }, [stopPlayback]);
    
    const isCtaScene = currentSceneIndex === script.scenes.length;
    const displayIndex = Math.min(currentSceneIndex, script.scenes.length - 1);
    
    const currentImage = scene_images[displayIndex];
    const onScreenText = isCtaScene ? script.cta : script.scenes[displayIndex]?.on_screen_text;
    const subtitleText = isCtaScene ? script.cta : script.scenes[displayIndex]?.voiceover_narration;
    
    return (
        <div className="video-preview-player">
            <div className="video-player-screen">
                {currentImage && (
                    <img 
                        key={displayIndex} 
                        src={currentImage.imageUrl} 
                        alt={`Scene ${displayIndex + 1}`} 
                        className={`scene-image-animated ${isPlaying ? 'playing' : ''}`}
                    />
                )}
                {onScreenText && (
                     <div className="subtitle-overlay">{onScreenText}</div>
                )}
            </div>

            <div className="timeline-container">
                 <input
                    type="range"
                    min="0"
                    max={script.scenes.length}
                    value={currentSceneIndex}
                    onChange={handleTimelineChange}
                    className="timeline-scrubber"
                    aria-label="Video timeline scrubber"
                />
            </div>

            <div className="video-player-controls">
                <button onClick={handleTogglePlay}>
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    {isPlaying ? 'Jeda' : 'Putar'}
                </button>
                <button onClick={handleRestart}>
                    <RestartIcon />
                    Ulangi
                </button>
            </div>
            <div className="video-player-subtitle">
                {subtitleText || ''}
            </div>
        </div>
    );
};

const EditableSceneCard = ({ scene, onUpdateScene }: { scene: YoutubeScene, onUpdateScene: (updatedScene: YoutubeScene) => void }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedVisual, setEditedVisual] = useState(scene.visual_description);
    const [editedNarration, setEditedNarration] = useState(scene.voiceover_narration);

    const handleEdit = () => setIsEditing(true);
    const handleCancel = () => {
        setEditedVisual(scene.visual_description);
        setEditedNarration(scene.voiceover_narration);
        setIsEditing(false);
    };
    const handleSave = () => {
        onUpdateScene({ ...scene, visual_description: editedVisual, voiceover_narration: editedNarration });
        setIsEditing(false);
    };
    
    return (
        <div className="storyboard-item">
            <div className="storyboard-item-number">{scene.scene_number}</div>
            <div className="storyboard-item-content">
                {isEditing ? (
                    <>
                        <div className="form-group">
                            <label>Visual Description</label>
                            <textarea value={editedVisual} onChange={e => setEditedVisual(e.target.value)} rows={3} />
                        </div>
                        <div className="form-group">
                            <label>Voiceover Narration</label>
                            <textarea value={editedNarration} onChange={e => setEditedNarration(e.target.value)} rows={3} />
                        </div>
                        <h5>On-Screen Text</h5>
                        <p>{scene.on_screen_text}</p>
                        <div className="storyboard-item-actions">
                            <button type="button" onClick={handleCancel} className="button-secondary">Batal</button>
                            <button type="button" onClick={handleSave} className="button-primary">Simpan</button>
                        </div>
                    </>
                ) : (
                    <>
                        <h5>Visual</h5>
                        <p>{scene.visual_description}</p>
                        <h5>Narasi</h5>
                        <p>{scene.voiceover_narration}</p>
                        <h5>Teks di Layar</h5>
                        <p>{scene.on_screen_text}</p>
                        <div className="storyboard-item-actions">
                            <button onClick={handleEdit} className="edit-storyboard-button"><EditIcon /> Edit Adegan</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const EditableReelSceneCard = ({ scene, onUpdateScene }: { scene: InstagramReelScene, onUpdateScene: (updatedScene: InstagramReelScene) => void }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedVisual, setEditedVisual] = useState(scene.visual_description);
    const [editedNarration, setEditedNarration] = useState(scene.voiceover_narration);
    const [editedOnScreenText, setEditedOnScreenText] = useState(scene.on_screen_text);

    const handleEdit = () => setIsEditing(true);

    const handleCancel = () => {
        setEditedVisual(scene.visual_description);
        setEditedNarration(scene.voiceover_narration);
        setEditedOnScreenText(scene.on_screen_text);
        setIsEditing(false);
    };

    const handleSave = () => {
        onUpdateScene({ ...scene, visual_description: editedVisual, voiceover_narration: editedNarration, on_screen_text: editedOnScreenText });
        setIsEditing(false);
    };

    return (
        <div className="storyboard-item">
            <div className="storyboard-item-number">{scene.scene_number}</div>
            <div className="storyboard-item-content">
                {isEditing ? (
                    <>
                        <div className="form-group">
                            <label>Visual Description</label>
                            <textarea value={editedVisual} onChange={e => setEditedVisual(e.target.value)} rows={3} />
                        </div>
                        <div className="form-group">
                            <label>Voiceover Narration</label>
                            <textarea value={editedNarration} onChange={e => setEditedNarration(e.target.value)} rows={2} />
                        </div>
                        <div className="form-group">
                            <label>On-Screen Text</label>
                            <textarea value={editedOnScreenText} onChange={e => setEditedOnScreenText(e.target.value)} rows={2} />
                        </div>
                        <div className="storyboard-item-actions">
                            <button type="button" onClick={handleCancel} className="button-secondary">Batal</button>
                            <button type="button" onClick={handleSave} className="button-primary">Simpan</button>
                        </div>
                    </>
                ) : (
                    <>
                        <h5>Visual</h5>
                        <p>{scene.visual_description}</p>
                        <h5>Narasi</h5>
                        <p>{scene.voiceover_narration}</p>
                        <h5>Teks di Layar</h5>
                        <p>{scene.on_screen_text}</p>
                        <div className="storyboard-item-actions">
                            <button onClick={handleEdit} className="edit-storyboard-button"><EditIcon /> Edit Adegan</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};


export const ShortYoutubeGenerator = ({
  allPlans,
  selectedPlanId,
  onSelectPlan,
  sourcePlan,
  scriptMutation,
  videoData,
  onGenerateScript,
  onGenerateVideo,
  videoLoading,
  videoError,
  videoProgress,
  onDownloadVideo,
  isDownloadingVideo,
  onBackToStoryboard,
  knowledgeSources,
  selectedKnowledgeSourceId,
  onSelectKnowledgeSource
}: {
  allPlans: HistoryItem<PlanInputs, PlanData>[];
  selectedPlanId: string | null;
  onSelectPlan: (id: string) => void;
  sourcePlan: HistoryItem<PlanInputs, PlanData> | null;
  scriptMutation: ReturnType<typeof useApiMutation<YoutubeShortScript, any>>;
  videoData: GeneratedYoutubeVideo | null;
  onGenerateScript: (day: DayPlan, planData: PlanData, planId: string) => void;
  onGenerateVideo: (script: YoutubeShortScript, method: 'standard' | 'veo') => void;
  videoLoading: boolean;
  videoError: string | null;
  videoProgress: number;
  onDownloadVideo: (videoData: VideoData) => void;
  isDownloadingVideo: boolean;
  onBackToStoryboard: () => void;
  knowledgeSources: KnowledgeSource[];
  selectedKnowledgeSourceId: string | null;
  onSelectKnowledgeSource: (id: string | null) => void;
}) => {
  const [selectedDay, setSelectedDay] = useState('');
  const [editableScript, setEditableScript] = useState<YoutubeShortScript | null>(null);
  const [highlightedSceneIndex, setHighlightedSceneIndex] = useState(-1);
  const [jumpToScene, setJumpToScene] = useState<number | null>(null);

  const planData = sourcePlan?.data;
  const planId = sourcePlan?.id;

  const currentScriptFromProps = scriptMutation.data || videoData?.script;
  
  useEffect(() => {
    setEditableScript(currentScriptFromProps || null);
    if (!currentScriptFromProps) {
        setHighlightedSceneIndex(-1);
    }
  }, [currentScriptFromProps]);

  useEffect(() => {
    const currentDayExists = planData?.plan.some(d => d.day.toString() === selectedDay);
    if (selectedDay && (!planData || !currentDayExists)) {
        setSelectedDay('');
    }
  }, [planData, selectedDay]);

  const handleUpdateScene = (indexToUpdate: number, updatedScene: YoutubeScene) => {
    if (!editableScript) return;
    const updatedScenes = editableScript.scenes.map((scene, index) => 
      index === indexToUpdate ? updatedScene : scene
    );
    setEditableScript({ ...editableScript, scenes: updatedScenes });
  };

  const handleGenerateScript = () => {
    if (!selectedDay || !planData?.plan) return;
    const day = planData.plan.find(d => d.day.toString() === selectedDay);
    if (day && planData && planId) {
      onGenerateScript(day, planData, planId);
    }
  };
    
  const handleGenerateVideoClick = (method: 'standard' | 'veo') => {
    if (!editableScript || !Array.isArray(editableScript.scenes)) {
        alert("Error: Script data is invalid or scenes are missing. Please try regenerating the script.");
        return;
    }
    onGenerateVideo(editableScript, method);
  };

  const isLoading = scriptMutation.loading;
  const scriptExists = !!editableScript;
  const resultExists = !!videoData;

  if (resultExists) {
      return (
          <div className="generated-result-view">
              <h3 className="result-title">{videoData.script.title}</h3>
              <div className="result-preview-container">
                  <VideoPreviewPlayer 
                    videoData={videoData} 
                    onSceneChange={setHighlightedSceneIndex}
                    jumpToScene={jumpToScene}
                    onJumpComplete={() => setJumpToScene(null)}
                  />
              </div>
              <div className="result-actions">
                  <button className="regenerate-button" onClick={onBackToStoryboard}>
                      <EditIcon /> Kembali ke Storyboard
                  </button>
                  <button className="regenerate-button" onClick={() => onGenerateVideo(videoData.script, videoData.generationMethod || 'standard')} disabled={isDownloadingVideo || videoLoading}>
                      ✨ Regenerate Video
                  </button>
                  <button className="download-button" onClick={() => onDownloadVideo(videoData)} disabled={isDownloadingVideo}>
                      <DownloadVideoIcon /> {isDownloadingVideo ? 'Downloading...' : 'Unduh Aset Video'}
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="youtube-generator-section">
        <KnowledgeSourceSelector 
            knowledgeSources={knowledgeSources}
            selectedKnowledgeSourceId={selectedKnowledgeSourceId}
            onSelectKnowledgeSource={onSelectKnowledgeSource}
            disabled={isLoading}
        />
        <SourcePlanSelector 
            allPlans={allPlans}
            selectedPlanId={selectedPlanId}
            onSelectPlan={onSelectPlan}
            disabled={isLoading}
        />
      
      {sourcePlan && !scriptExists && !isLoading && (
        <div className="day-selector-container">
          <div className="form-group">
              <label htmlFor="day_select">Pilih Hari dari Rencana Konten</label>
              <select id="day_select" value={selectedDay} onChange={e => setSelectedDay(e.target.value)} disabled={isLoading}>
                  <option value="" disabled>-- Pilih Hari --</option>
                  {planData?.plan.map(day => (
                      <option key={day.day} value={day.day}>Hari {day.day}: {day.theme}</option>
                  ))}
              </select>
          </div>
          <button className="submit-button" onClick={handleGenerateScript} disabled={!selectedDay || isLoading}>
              <span className="button-text">{scriptMutation.loading ? 'Generating Script...' : 'Generate Script'}</span>
              {scriptMutation.loading && <div className="button-progress" style={{ width: `${scriptMutation.progress}%` }}></div>}
              {scriptMutation.loading && <span className="button-progress-text">{`${Math.round(scriptMutation.progress)}%`}</span>}
          </button>
        </div>
      )}

      {isLoading && <div className="results-container"><LoadingSpinner /></div>}
      {scriptMutation.error && <div className="results-container"><ErrorMessage message={scriptMutation.error} /></div>}
      
      {scriptExists && !isLoading && !resultExists && (
          <div className="script-hub-container">
              <div className="script-hub-header">
                  <h3>{editableScript.title}</h3>
                  <div className="script-metadata-grid">
                      <div className="script-metadata-item">
                          <h4>Hook</h4>
                          <p>{editableScript.hook}</p>
                      </div>
                      <div className="script-metadata-item">
                          <h4>Saran Musik</h4>
                          <p>{editableScript.music_suggestion}</p>
                      </div>
                      <div className="script-metadata-item">
                          <h4>Call To Action</h4>
                          <p>{editableScript.cta}</p>
                      </div>
                  </div>
              </div>

              <div>
                <h4>Langkah 1: Tinjau Storyboard</h4>
                <div className="storyboard-list">
                    {editableScript.scenes.map((scene, index) => (
                        <EditableSceneCard
                            key={scene.scene_number}
                            scene={scene}
                            onUpdateScene={(updatedScene) => handleUpdateScene(index, updatedScene)}
                        />
                    ))}
                </div>
              </div>
              
              <div className="generation-controls-container">
                  <h4>Langkah 2: Hidupkan Skrip Anda</h4>
                  <p>Pilih metode untuk menghasilkan visual bagi setiap adegan dalam skrip Anda.</p>
                  <div className="video-generation-options">
                      <div className="generation-option-card">
                          <h5>Pratinjau Standar</h5>
                          <p className="option-description">Menghasilkan visual dengan cepat menggunakan prompt dasar. Ideal untuk draf awal dan validasi konsep.</p>
                          <div className="form-actions">
                              <button className="submit-button" onClick={() => handleGenerateVideoClick('standard')} disabled={videoLoading}>
                                <span className="button-text">{videoLoading ? 'Menghasilkan...' : 'Hasilkan Pratinjau Standar'}</span>
                                  {videoLoading && <div className="button-progress" style={{ width: `${videoProgress}%` }}></div>}
                                  {videoLoading && <span className="button-progress-text">{`${Math.round(videoProgress)}%`}</span>}
                              </button>
                          </div>
                      </div>
                      <div className="generation-option-card veo-option">
                          <h5><SparklesIcon /> Pratinjau Veo (Tingkat Lanjut)</h5>
                          <p className="option-description">Menggunakan prompt yang disempurnakan untuk hasil sinematik dan fotorealistik. Direkomendasikan untuk kualitas akhir.</p>
                          <div className="form-actions">
                               <button className="submit-button veo" onClick={() => handleGenerateVideoClick('veo')} disabled={videoLoading}>
                                  <span className="button-text">{videoLoading ? 'Menghasilkan...' : 'Hasilkan dengan Veo'}</span>
                              </button>
                          </div>
                      </div>
                  </div>
                   {videoLoading && <LoadingSpinner />}
                   {videoError && <ErrorMessage message={videoError} />}
              </div>
          </div>
      )}

      {!sourcePlan && !scriptExists && !isLoading && (
        <div className="empty-source-plan-message">
            <p>Harap pilih Rencana Konten dari dropdown di atas, atau hasilkan skrip dari tab Trend Fusion.</p>
            <PromptStudioPlaceholder />
        </div>
      )}
    </div>
  );
};

export const InstagramReelsGenerator = ({
  allPlans,
  selectedPlanId,
  onSelectPlan,
  sourcePlan,
  scriptMutation,
  visualData,
  onGenerateScript,
  onGenerateVisual,
  visualLoading,
  visualError,
  onBackToStoryboard,
  knowledgeSources,
  selectedKnowledgeSourceId,
  onSelectKnowledgeSource
}: {
  allPlans: HistoryItem<PlanInputs, PlanData>[];
  selectedPlanId: string | null;
  onSelectPlan: (id: string) => void;
  sourcePlan: HistoryItem<PlanInputs, PlanData> | null;
  scriptMutation: ReturnType<typeof useApiMutation<InstagramReelsScript, any>>;
  visualData: GeneratedVisualData | null;
  onGenerateScript: (day: DayPlan, planData: PlanData, planId: string) => void;
  onGenerateVisual: (script: InstagramReelsScript, method: 'standard' | 'veo') => void;
  visualLoading: boolean;
  visualError: string | null;
  onBackToStoryboard: () => void;
  knowledgeSources: KnowledgeSource[];
  selectedKnowledgeSourceId: string | null;
  onSelectKnowledgeSource: (id: string | null) => void;
}) => {
  const [selectedDay, setSelectedDay] = useState('');
  const [editableScript, setEditableScript] = useState<InstagramReelsScript | null>(null);
  
  const planData = sourcePlan?.data;
  const planId = sourcePlan?.id;

  // This effect synchronizes the local editable script with the prop from the parent.
  // This is done carefully to avoid wiping out user edits unnecessarily and
  // to prevent potential render loops by only running when the source prop changes.
  useEffect(() => {
    setEditableScript(scriptMutation.data);
  }, [scriptMutation.data]);

  useEffect(() => {
    const currentDayExists = planData?.plan.some(d => d.day.toString() === selectedDay);
    if (selectedDay && (!planData || !currentDayExists)) {
        setSelectedDay('');
    }
  }, [planData, selectedDay]);

  const handleUpdateScene = (indexToUpdate: number, updatedScene: InstagramReelScene) => {
    if (!editableScript) return;
    const updatedScenes = editableScript.scenes.map((scene, index) =>
      index === indexToUpdate ? updatedScene : scene
    );
    setEditableScript({ ...editableScript, scenes: updatedScenes });
  };

  const handleGenerateScript = () => {
    if (!selectedDay || !planData?.plan) return;
    const day = planData.plan.find(d => d.day.toString() === selectedDay);
    if (day && planData && planId) {
      onGenerateScript(day, planData, planId);
    }
  };

  const handleGenerateVisualClick = (method: 'standard' | 'veo') => {
    if (!editableScript) {
        alert("Error: Script data is invalid. Please try regenerating the script.");
        return;
    }
    onGenerateVisual(editableScript, method);
  };

  const isLoading = scriptMutation.loading;
  const scriptExists = !!editableScript;
  const resultExists = !!visualData;

  if (resultExists && scriptExists) {
      return (
          <div className="generated-result-view">
              <h3 className="result-title">{editableScript.hook}</h3>
              <div className="result-preview-container">
                  <img src={visualData.imageUrl} alt="Generated Instagram visual" />
              </div>
              <div className="result-actions">
                  <button className="regenerate-button" onClick={onBackToStoryboard}>
                      <EditIcon /> Kembali ke Storyboard
                  </button>
                  <button className="regenerate-button" onClick={() => handleGenerateVisualClick(visualData.generationMethod || 'standard')} disabled={visualLoading}>
                      ✨ Regenerate Visual
                  </button>
                  <DownloadButton imageUrl={visualData.imageUrl} filename={`${slugify(editableScript.hook)}.jpg`} />
                  <CopyButton textToCopy={visualData.prompt} label="Copy Prompt" />
              </div>
               {visualLoading && <LoadingSpinner />}
               {visualError && <ErrorMessage message={visualError} />}
          </div>
      );
  }

  return (
    <div className="instagram-reels-generator-section">
        <KnowledgeSourceSelector 
            knowledgeSources={knowledgeSources}
            selectedKnowledgeSourceId={selectedKnowledgeSourceId}
            onSelectKnowledgeSource={onSelectKnowledgeSource}
            disabled={isLoading || visualLoading}
        />
        <SourcePlanSelector 
            allPlans={allPlans}
            selectedPlanId={selectedPlanId}
            onSelectPlan={onSelectPlan}
            disabled={isLoading || visualLoading}
        />
      
      {sourcePlan && !scriptExists && !isLoading && (
        <div className="day-selector-container">
          <div className="form-group">
            <label htmlFor="day_select_reels">Pilih Hari dari Rencana Konten</label>
            <select id="day_select_reels" value={selectedDay} onChange={e => setSelectedDay(e.target.value)} disabled={isLoading}>
              <option value="" disabled>-- Pilih Hari --</option>
              {planData?.plan.map(day => (
                <option key={day.day} value={day.day}>Hari {day.day}: {day.theme}</option>
              ))}
            </select>
          </div>
          <button className="submit-button" onClick={handleGenerateScript} disabled={!selectedDay || isLoading}>
            <span className="button-text">{scriptMutation.loading ? 'Generating Script...' : 'Generate Reels Script'}</span>
            {scriptMutation.loading && <div className="button-progress" style={{ width: `${scriptMutation.progress}%` }}></div>}
            {scriptMutation.loading && <span className="button-progress-text">{`${Math.round(scriptMutation.progress)}%`}</span>}
          </button>
        </div>
      )}

      {isLoading && <div className="results-container"><LoadingSpinner /></div>}
      {scriptMutation.error && <div className="results-container"><ErrorMessage message={scriptMutation.error} /></div>}
      
      {scriptExists && !isLoading && !resultExists && (
            <div className="script-hub-container">
                <div className="script-hub-header">
                    <h3>{editableScript.hook}</h3>
                    <div className="script-metadata-grid">
                        <div className="script-metadata-item">
                            <h4>Saran Audio</h4>
                            <p>{editableScript.audio_suggestion}</p>
                        </div>
                        <div className="script-metadata-item">
                            <h4>Hashtags</h4>
                            <p className="hashtags">{editableScript.hashtags.join(' ')}</p>
                        </div>
                         <div className="script-metadata-item">
                            <h4>Call to Action</h4>
                            <p>{editableScript.cta}</p>
                        </div>
                    </div>
                </div>

                <div>
                    <h4>Langkah 1: Tinjau Storyboard</h4>
                    <div className="storyboard-list">
                        {editableScript.scenes.map((scene, index) => (
                            <EditableReelSceneCard
                                key={scene.scene_number}
                                scene={scene}
                                onUpdateScene={(updatedScene) => handleUpdateScene(index, updatedScene)}
                            />
                        ))}
                    </div>
                </div>
                
                <div className="generation-controls-container">
                    <h4>Langkah 2: Hasilkan Visual</h4>
                    <p>Pilih metode untuk menghasilkan visual untuk Reel Anda.</p>
                    <div className="video-generation-options">
                        <div className="generation-option-card">
                            <h5>Visual Standar</h5>
                            <p className="option-description">Menghasilkan visual dengan cepat menggunakan prompt dasar.</p>
                            <div className="form-actions">
                              <button className="submit-button" onClick={() => handleGenerateVisualClick('standard')} disabled={visualLoading}>
                                 <span className="button-text">{visualLoading ? 'Menghasilkan...' : 'Hasilkan Visual Standar'}</span>
                              </button>
                          </div>
                        </div>
                         <div className="generation-option-card veo-option">
                            <h5><SparklesIcon /> Visual Veo (Tingkat Lanjut)</h5>
                            <p className="option-description">Menggunakan prompt yang disempurnakan untuk hasil sinematik.</p>
                             <div className="form-actions">
                               <button className="submit-button veo" onClick={() => handleGenerateVisualClick('veo')} disabled={visualLoading}>
                                  <span className="button-text">{visualLoading ? 'Menghasilkan...' : 'Hasilkan dengan Veo'}</span>
                              </button>
                          </div>
                        </div>
                    </div>
                   {visualLoading && <LoadingSpinner />}
                   {visualError && <ErrorMessage message={visualError} />}
                </div>
            </div>
      )}

      {!sourcePlan && !scriptExists && !isLoading && (
        <div className="empty-source-plan-message">
            <p>Harap pilih Rencana Konten dari dropdown di atas, atau hasilkan skrip dari tab Trend Fusion.</p>
            <PromptStudioPlaceholder />
        </div>
      )}
    </div>
  );
};

export const TrendFusionGenerator = ({
  allPlans,
  selectedPlanId,
  onSelectPlan,
  sourcePlan,
  trendData,
  onAnalyze,
  loading,
  error,
  progress,
  onCreateScriptFromIdea,
  knowledgeSources,
  selectedKnowledgeSourceId,
  onSelectKnowledgeSource
}: {
  allPlans: HistoryItem<PlanInputs, PlanData>[];
  selectedPlanId: string | null;
  onSelectPlan: (id: string) => void;
  sourcePlan: HistoryItem<PlanInputs, PlanData> | null;
  trendData: TrendFusionResponse | null;
  onAnalyze: (manualInputs?: TrendFusionInputs) => void;
  loading: boolean;
  error: string | null;
  progress: number;
  onCreateScriptFromIdea: (idea: TrendIdea, platform: 'youtube' | 'instagram') => void;
  knowledgeSources: KnowledgeSource[];
  selectedKnowledgeSourceId: string | null;
  onSelectKnowledgeSource: (id: string | null) => void;
}) => {
    const [manualNiche, setManualNiche] = useState('');
    const [manualAudience, setManualAudience] = useState('');

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAnalyze({ niche: manualNiche, target_audience: manualAudience });
    };

    const sourcePlanDetails = sourcePlan?.inputs;
    
    return (
        <div className="generator-section trend-fusion-generator">
            <div className="trend-fusion-controls">
                 <h3><TrendIcon /> Gabungkan Tren Viral dengan Niche Anda</h3>
                 <p>Pilih rencana konten yang ada atau masukkan niche secara manual untuk mendapatkan ide konten yang relevan dengan tren saat ini.</p>
                <KnowledgeSourceSelector 
                    knowledgeSources={knowledgeSources}
                    selectedKnowledgeSourceId={selectedKnowledgeSourceId}
                    onSelectKnowledgeSource={onSelectKnowledgeSource}
                    disabled={loading}
                    showLabel={false}
                />
                 <SourcePlanSelector 
                    allPlans={allPlans}
                    selectedPlanId={selectedPlanId}
                    onSelectPlan={onSelectPlan}
                    disabled={loading}
                />
                <div className="form-actions">
                     <button onClick={() => onAnalyze()} className="submit-button" disabled={loading || !sourcePlan}>
                        <span className="button-text">{loading ? 'Menganalisis...' : 'Analisis Tren untuk Rencana'}</span>
                        {loading && <div className="button-progress" style={{width: `${progress}%`}}></div>}
                    </button>
                </div>
                
                 <div className="manual-input-divider">ATAU</div>

                <form className="input-manual" onSubmit={handleManualSubmit}>
                    <div className="form-group">
                        <label htmlFor="manual_niche">Niche Manual</label>
                        <input type="text" id="manual_niche" value={manualNiche} onChange={e => setManualNiche(e.target.value)} placeholder="e.g., Produktivitas, Stoicism" required/>
                    </div>
                     <div className="form-group">
                        <label htmlFor="manual_audience">Audiens Manual</label>
                        <input type="text" id="manual_audience" value={manualAudience} onChange={e => setManualAudience(e.target.value)} placeholder="e.g., Pelajar, Freelancer" required/>
                    </div>
                     <div className="form-actions">
                        <button type="submit" className="submit-button" disabled={loading || !manualNiche || !manualAudience}>
                            Analisis Tren Manual
                        </button>
                    </div>
                </form>
            </div>
            <div className="results-container">
                {loading && <LoadingSpinner />}
                {error && <ErrorMessage message={error} />}
                {trendData && trendData.ideas ? (
                    <div className="trend-ideas-grid">
                        {trendData.ideas.map((idea, index) => (
                            <div key={index} className="trend-idea-card">
                                <div className="trend-card-header">
                                    <h4>{idea.trend_name}</h4>
                                </div>
                                <div className="trend-card-section">
                                    <h5>Potensi FYP</h5>
                                    <p>{idea.fyp_potential_reason}</p>
                                </div>
                                <div className="trend-card-section">
                                    <h5><SparklesIcon/> Ide Fusion</h5>
                                    <h5 className="fused-idea-title">{idea.fused_idea_title}</h5>
                                    <p>{idea.content_angle}</p>
                                </div>
                                <div className="trend-card-actions">
                                    <button onClick={() => onCreateScriptFromIdea(idea, 'youtube')}><YoutubeIcon/> Script YT</button>
                                    <button onClick={() => onCreateScriptFromIdea(idea, 'instagram')}><ReelsIcon/> Script Reels</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    !loading && !error && (
                        <div className="prompt-studio-placeholder">
                            <p>Ide konten hasil perpaduan tren akan muncul di sini.</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export const PerformanceAnalyzer = ({
    allPlans,
    selectedPlanId,
    onSelectPlan,
    sourcePlan,
    onUpdateArtifact,
    analysisMutation,
    channelAuditMutation,
    onCreateScriptFromInsight,
    onAddHistory,
    initialData
}: {
    allPlans: HistoryItem<PlanInputs, PlanData>[];
    selectedPlanId: string | null;
    onSelectPlan: (id: string) => void;
    sourcePlan: HistoryItem<PlanInputs, PlanData> | null;
    onUpdateArtifact: (planId: string, dayNumber: number, artifactKey: keyof DailyArtifacts, data: any) => void;
    analysisMutation: ReturnType<typeof useApiMutation<PerformanceAnalysisResponse, any>>;
    channelAuditMutation: ReturnType<typeof useApiMutation<PerformanceAnalysisResponse, ChannelAuditInputs>>;
    onCreateScriptFromInsight: (idea: GrowthInsight['actionable_idea']) => void;
    onAddHistory: (type: TabType, inputs: any, data: any, title: string) => void;
    initialData: PerformanceAnalysisResponse | null;
}) => {
    const [channelUrl, setChannelUrl] = useState('');
    const [analysisData, setAnalysisData] = useState<PerformanceAnalysisResponse | null>(initialData);
    const [chartMetric, setChartMetric] = useState<keyof PerformanceMetrics>('views');

    useEffect(() => {
        setAnalysisData(initialData);
    }, [initialData]);
    
    const { loading: manualLoading, error: manualError, progress: manualProgress, mutate: manualMutate } = analysisMutation;
    const { loading: auditLoading, error: auditError, progress: auditProgress, mutate: auditMutate } = channelAuditMutation;
    
    const handleAuditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setAnalysisData(null);
        const variables = { channel_url: channelUrl };
        auditMutate(variables, (newData) => {
            setAnalysisData(newData);
            onAddHistory('analyzer', variables, newData, `Audit: ${channelUrl}`);
        });
    };
    
    const uploadedContent = useMemo(() => {
        if (!sourcePlan) return [];
        return sourcePlan.data.plan
            .filter(day => {
                const artifacts = sourcePlan.data.daily_artifacts?.[day.day];
                return artifacts?.uploaded && artifacts?.metrics && Object.values(artifacts.metrics).some(m => m > 0);
            })
            .map(day => ({...day, metrics: sourcePlan.data.daily_artifacts![day.day].metrics! }));
    }, [sourcePlan]);


    const handleManualAnalyze = () => {
        const performance_data = uploadedContent.map(day => ({
            content_idea: day.content_idea,
            theme: day.theme,
            hook_style: 'unknown',
            metrics: day.metrics
        }));

        if (!performance_data || performance_data.length < 2) {
            alert("Harap tambahkan data metrik untuk setidaknya 2 postingan yang diunggah di Rencana Konten yang dipilih untuk analisis yang berarti.");
            return;
        }
        setAnalysisData(null);
        manualMutate({ function_name: "analyzePerformance", performance_data }, (newData) => {
             setAnalysisData(newData);
             onAddHistory('analyzer', { sourcePlanId: selectedPlanId, type: 'manual' }, newData, `Manual Analysis: ${sourcePlan?.title}`);
        });
    };
    
    const chartData = useMemo(() => {
      if (uploadedContent.length === 0) return [];
      return uploadedContent.map(day => ({
          label: day.content_idea,
          value: day.metrics[chartMetric] || 0
      }));
    }, [uploadedContent, chartMetric]);

    const uploadedAndHasMetricsCount = uploadedContent.length;

    const loading = auditLoading || manualLoading;
    const error = auditError || manualError;
    const progress = auditProgress > manualProgress ? auditProgress : manualProgress;
    const metricKeys: Array<keyof PerformanceMetrics> = ['views', 'likes', 'comments', 'shares', 'saves'];

    return (
        <div className="generator-section performance-analyzer">
            <div className="analyzer-header">
                <h2><AnalyzerIcon /> Penganalisis Bertenaga AI</h2>
                <p>Dapatkan wawasan strategis untuk meningkatkan performa konten Anda. Pilih antara audit otomatis berbasis URL atau analisis mendalam berbasis metrik manual.</p>
            </div>

            <div className="ai-channel-auditor">
                <h3><SparklesIcon /> AI Channel Auditor</h3>
                <p>Masukkan URL profil media sosial Anda (YouTube, Instagram, dll.) dan biarkan AI memberikan analisis cepat tentang apa yang berhasil untuk channel tersebut.</p>
                <form onSubmit={handleAuditSubmit} className="ai-channel-auditor-form">
                    <div className="form-group">
                        <label htmlFor="channel_url">URL Profil Media Sosial</label>
                        <input
                            type="url"
                            id="channel_url"
                            name="channel_url"
                            value={channelUrl}
                            onChange={(e) => setChannelUrl(e.target.value)}
                            placeholder="https://www.youtube.com/@username"
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="submit-button" disabled={loading || !channelUrl}>
                            <span className="button-text">{auditLoading ? 'Menganalisis...' : 'Audit dengan AI'}</span>
                            {auditLoading && <div className="button-progress" style={{ width: `${progress}%` }}></div>}
                            {auditLoading && <span className="button-progress-text">{`${Math.round(progress)}%`}</span>}
                        </button>
                    </div>
                </form>
            </div>

            <div className="manual-analysis-divider">Atau Lakukan Analisis Manual</div>

            <SourcePlanSelector allPlans={allPlans} selectedPlanId={selectedPlanId} onSelectPlan={onSelectPlan} disabled={loading} />

            {sourcePlan && (
                <div className="performance-analyzer-content">
                    <div className="metric-input-header">
                        <div className="header-info">Info Konten</div>
                        <div className="header-status">Status Diunggah</div>
                        <div className="header-metrics"><div className="metric-inputs-group-header"><span>Views</span><span>Likes</span><span>Comments</span><span>Shares</span><span>Saves</span></div></div>
                    </div>
                    <div className="metrics-input-list">
                        {sourcePlan.data.plan.map(day => {
                            const artifacts = sourcePlan.data.daily_artifacts?.[day.day];
                            const metrics = artifacts?.metrics || { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 };
                            const handleMetricChange = (field: keyof PerformanceMetrics, value: string) => {
                                const newMetrics = { ...(artifacts?.metrics || { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 }), [field]: Number(value) || 0 };
                                onUpdateArtifact(sourcePlan.id, day.day, 'metrics', newMetrics);
                            };
                            return (
                                <div key={day.day} className="metric-input-row">
                                    <div className="metric-content-info"><span className="metric-content-day">Hari {day.day}: {day.theme}</span><p className="metric-content-idea">{day.content_idea}</p></div>
                                    <div className="metric-uploaded-toggle">
                                        <input type="checkbox" id={`uploaded-metric-${day.day}`} checked={artifacts?.uploaded ?? false} onChange={(e) => onUpdateArtifact(sourcePlan.id, day.day, 'uploaded', e.target.checked)} />
                                        <label htmlFor={`uploaded-metric-${day.day}`}>Diunggah</label>
                                    </div>
                                    <div className="metric-inputs-group">
                                        <input type="number" placeholder="Views" value={metrics.views || ''} onChange={e => handleMetricChange('views', e.target.value)} disabled={!artifacts?.uploaded} className="metric-input" />
                                        <input type="number" placeholder="Likes" value={metrics.likes || ''} onChange={e => handleMetricChange('likes', e.target.value)} disabled={!artifacts?.uploaded} className="metric-input" />
                                        <input type="number" placeholder="Comments" value={metrics.comments || ''} onChange={e => handleMetricChange('comments', e.target.value)} disabled={!artifacts?.uploaded} className="metric-input" />
                                        <input type="number" placeholder="Shares" value={metrics.shares || ''} onChange={e => handleMetricChange('shares', e.target.value)} disabled={!artifacts?.uploaded} className="metric-input" />
                                        <input type="number" placeholder="Saves" value={metrics.saves || ''} onChange={e => handleMetricChange('saves', e.target.value)} disabled={!artifacts?.uploaded} className="metric-input" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            <div className="form-actions" style={{ justifyContent: 'center' }}>
                <button onClick={handleManualAnalyze} className="submit-button" disabled={loading || uploadedAndHasMetricsCount < 2}>
                    <span className="button-text">{manualLoading ? 'Menganalisis...' : `Jalankan Analisis Manual (${uploadedAndHasMetricsCount} Postingan)`}</span>
                    {manualLoading && <div className="button-progress" style={{ width: `${progress}%` }}></div>}
                    {manualLoading && <span className="button-progress-text">{`${Math.round(progress)}%`}</span>}
                </button>
            </div>
             
             {chartData.length > 0 && (
                <>
                    <div className="chart-metric-selector">
                        {metricKeys.map(metric => (
                            <button
                                key={metric}
                                className={chartMetric === metric ? 'active' : ''}
                                onClick={() => setChartMetric(metric)}
                            >
                                {metric.charAt(0).toUpperCase() + metric.slice(1)}
                            </button>
                        ))}
                    </div>
                    <BarChart
                        data={chartData}
                        title={`Perbandingan Kinerja Berdasarkan ${chartMetric.charAt(0).toUpperCase() + chartMetric.slice(1)}`}
                    />
                </>
            )}

            <div className="results-container">
                {loading && <LoadingSpinner />}
                {error && <ErrorMessage message={error} />}
                {analysisData && analysisData.insights && (
                    <div className="insights-grid">
                        <h3><SparklesIcon /> Wawasan & Rekomendasi</h3>
                        {analysisData.insights.map((insight, index) => (
                            <div key={index} className="trend-idea-card">
                                <div className="trend-card-section"><h5><ChartIcon /> Temuan</h5><p>{insight.finding}</p></div>
                                <div className="trend-card-section"><h5>Rekomendasi</h5><p>{insight.recommendation}</p></div>
                                {insight.actionable_idea && insight.actionable_idea.content_idea && (
                                    <div className="trend-card-actions">
                                        <button onClick={() => onCreateScriptFromInsight(insight.actionable_idea)}>
                                            <SparklesIcon /> Buat Konten dari Ide Ini
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export const PromptStudioGenerator = ({
  promptData,
  inputs,
  onSubmit,
  loading,
  error,
  progress,
  knowledgeSources,
  selectedKnowledgeSourceId,
  onSelectKnowledgeSource
}: {
  promptData: PromptStudioResponse | null;
  inputs: Partial<PromptStudioInputs>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string | null;
  progress: number;
  knowledgeSources: KnowledgeSource[];
  selectedKnowledgeSourceId: string | null;
  onSelectKnowledgeSource: (id: string | null) => void;
}) => {
    const modifiers = [
        "photorealistic", "cinematic", "8k", "hyper-detailed", "dramatic lighting", "surreal", "watercolor", "minimalist", "vintage"
    ];

    return (
        <div className="generator-section prompt-studio-generator">
            <div className="prompt-studio-form-container">
                 <h3><SparklesIcon/> Prompt Studio</h3>
                <p>Ubah ide dasar menjadi beberapa variasi prompt yang dioptimalkan untuk model AI Generatif tertentu. Pilih pengubah untuk menyempurnakan gaya Anda.</p>
                 <KnowledgeSourceSelector 
                    knowledgeSources={knowledgeSources}
                    selectedKnowledgeSourceId={selectedKnowledgeSourceId}
                    onSelectKnowledgeSource={onSelectKnowledgeSource}
                    disabled={loading}
                    showLabel={false}
                />
                <form onSubmit={onSubmit} className="form">
                    <div className="form-group">
                        <label htmlFor="base_idea">Ide Dasar Prompt</label>
                        <textarea id="base_idea" name="base_idea" rows={3} defaultValue={inputs?.base_idea || ''} placeholder="e.g., A cat wearing a spacesuit" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="target_ai">Target AI</label>
                        <select id="target_ai" name="target_ai" defaultValue={inputs?.target_ai || 'midjourney'}>
                            <option value="midjourney">Midjourney</option>
                            <option value="stable_diffusion">Stable Diffusion</option>
                            <option value="dalle3">DALL-E 3</option>
                            <option value="video_cinematic">Video (Sinematik)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Modifier (pilih beberapa)</label>
                        <div className="modifier-group">
                            {modifiers.map(mod => (
                                <label key={mod} htmlFor={`mod-${mod}`}>
                                    <input type="checkbox" id={`mod-${mod}`} name="modifiers" value={mod} defaultChecked={inputs?.modifiers?.includes(mod)} />
                                    <span>{mod}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="submit-button" disabled={loading}>
                            <span className="button-text">{loading ? 'Generating...' : 'Ciptakan Prompt Ajaib'}</span>
                            {loading && <div className="button-progress" style={{ width: `${progress}%` }}></div>}
                            {loading && <span className="button-progress-text">{`${Math.round(progress)}%`}</span>}
                        </button>
                    </div>
                </form>
            </div>
            <div className="prompt-studio-results-container">
                {loading && <LoadingSpinner />}
                {error && <ErrorMessage message={error} />}
                {promptData && promptData.prompts ? (
                    <div className="prompt-results-grid">
                        {promptData.prompts.map((p, i) => (
                            <div key={i} className="prompt-variation-card">
                                <h5>{p.title}</h5>
                                <div className="prompt-text">{p.prompt}</div>
                                {p.negative_prompt && (
                                    <>
                                        <h6 className="negative-prompt-heading">Negative Prompt</h6>
                                        <div className="prompt-text negative">{p.negative_prompt}</div>
                                    </>
                                )}
                                <div className="prompt-card-actions">
                                    <CopyButton textToCopy={p.prompt} label="Copy"/>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    !loading && !error && <PromptStudioPlaceholder />
                )}
            </div>
        </div>
    );
};

export const DashboardGenerator = ({ history, onSelectHistoryItem }: {
    history: { [key in TabType]: HistoryItem<any, any>[] };
    onSelectHistoryItem: (id: string) => void;
}) => {
    const pinnedItems = useMemo(() =>
        Object.values(history).flat().filter(item => item.pinned).sort((a, b) => b.timestamp - a.timestamp)
    , [history]);

    const recentItems = useMemo(() =>
        Object.values(history).flat().sort((a, b) => b.timestamp - a.timestamp).slice(0, 5)
    , [history]);

    const totalItems = Object.values(history).flat().length;

    const weeklyActivityData = useMemo(() => {
        const activity = Array(7).fill(0).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return {
                label: date.toLocaleDateString('en-US', { weekday: 'short' }),
                value: 0
            };
        }).reverse();

        Object.values(history).flat().forEach(item => {
            const itemDate = new Date(item.timestamp);
            const today = new Date();
            const diffDays = Math.ceil((today.getTime() - itemDate.getTime()) / (1000 * 3600 * 24));
            if (diffDays <= 7) {
                const dayIndex = 6 - (diffDays - 1);
                if (dayIndex >= 0) {
                    activity[dayIndex].value += 1;
                }
            }
        });
        return activity;
    }, [history]);

    const ICONS: { [key in TabType]: React.ReactNode } = { dashboard: <DashboardIcon />, plan: <PlanIcon />, youtube: <YoutubeIcon />, instagram: <ReelsIcon />, trend: <TrendIcon />, analyzer: <AnalyzerIcon />, prompt_studio: <SparklesIcon/>, knowledge_hub: <BrainCircuitIcon /> };

    const renderHistoryItem = (item: HistoryItem<any, any>) => (
        <li key={item.id} className="dashboard-item" onClick={() => onSelectHistoryItem(item.id)}>
            <div className="dashboard-item-icon">{ICONS[item.type]}</div>
            <div className="dashboard-item-info">
                <span className="dashboard-item-title">{item.title}</span>
                <span className="dashboard-item-date">{new Date(item.timestamp).toLocaleDateString()}</span>
            </div>
            <div className="dashboard-item-type">{item.type}</div>
        </li>
    );

    return (
        <div className="generator-section dashboard-generator">
            <div className="dashboard-header">
                <h2>Selamat Datang Kembali!</h2>
                <p>Berikut adalah ringkasan aktivitas terakhir Anda. Anda telah membuat total <strong>{totalItems}</strong> aset.</p>
            </div>

            <div className="dashboard-grid">
                 <div className="dashboard-widget full-width">
                    <h3><LineChartIcon /> Aktivitas Konten 7 Hari Terakhir</h3>
                    <LineChart data={weeklyActivityData} />
                </div>
                <div className="dashboard-widget">
                    <h3><PinIcon isPinned={true} /> Item yang Disematkan</h3>
                    {pinnedItems.length > 0 ? (
                        <ul className="dashboard-list">
                            {pinnedItems.map(renderHistoryItem)}
                        </ul>
                    ) : (
                        <p className="dashboard-empty-state">Anda belum menyematkan item apa pun. Klik ikon pin di riwayat untuk akses cepat.</p>
                    )}
                </div>

                <div className="dashboard-widget">
                    <h3>Aktivitas Terbaru</h3>
                    {recentItems.length > 0 ? (
                         <ul className="dashboard-list">
                            {recentItems.map(renderHistoryItem)}
                        </ul>
                    ) : (
                        <p className="dashboard-empty-state">Mulai buat konten untuk melihat aktivitas terbaru Anda di sini.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export const KnowledgeHubGenerator = ({ knowledgeSources, onAddFiles, onDeleteSource }: {
    knowledgeSources: KnowledgeSource[];
    onAddFiles: (files: FileList) => void;
    onDeleteSource: (id: string) => void;
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            onAddFiles(e.target.files);
        }
    };
    
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onAddFiles(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };
    
    const getFileIcon = (fileType: string) => {
        if (fileType.includes('pdf')) return <PdfIcon />;
        if (fileType.includes('word')) return <WordIcon />;
        return <FileTextIcon />;
    };

    return (
        <div className="generator-section knowledge-hub-generator">
            <div className="knowledge-hub-header">
                <h2><BrainCircuitIcon /> Pusat Pengetahuan</h2>
                <p>Unggah dokumen, catatan, atau file teks Anda untuk dijadikan "Otak Kedua" bagi AI. Saat menghasilkan konten, Anda dapat memilih sumber ini agar AI menggunakan gaya, nada, dan informasi spesifik dari dokumen Anda.</p>
            </div>

            <div 
                className={`knowledge-hub-drop-zone ${isDragging ? 'dragging' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={triggerFileInput}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    accept=".pdf,.txt,.docx,.pptx"
                    style={{ display: 'none' }}
                    aria-hidden="true"
                />
                <div className="dropzone-content">
                    <UploadCloudIcon />
                    <p>Seret & lepas file di sini, atau klik untuk menelusuri</p>
                    <small>Didukung: .pdf, .txt, .docx, .pptx</small>
                </div>
            </div>

            <div className="knowledge-source-list">
                {knowledgeSources.length > 0 ? (
                    knowledgeSources.map(source => (
                        <div key={source.id} className={`knowledge-source-item status-${source.status}`}>
                            <div className="source-item-icon">{getFileIcon(source.fileType)}</div>
                            <div className="source-item-info">
                                <span className="source-item-name">{source.name}</span>
                                {source.status === 'processing' && <span className="source-item-status">Memproses... <LoadingSpinner /></span>}
                                {source.status === 'ready' && <span className="source-item-status ready">Siap Digunakan</span>}
                                {source.status === 'error' && <span className="source-item-status error">Error: {source.errorMessage || 'Gagal memproses'}</span>}
                            </div>
                            <button className="source-item-delete" onClick={(e) => { e.stopPropagation(); onDeleteSource(source.id); }} aria-label={`Delete ${source.name}`}>
                                <TrashIcon />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="dashboard-empty-state">
                        <p>Belum ada sumber pengetahuan. Unggah file pertama Anda untuk memulai.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const MultiplierModal = ({ item, onClose, mutation, onSuccess }: {
    item: HistoryItem<any, any> | null;
    onClose: () => void;
    mutation: ReturnType<typeof useApiMutation<MultiplierResponse, any>>;
    onSuccess: (type: TabType, data: any, title: string) => void;
}) => {
    const [selectedPlatforms, setSelectedPlatforms] = useState<Array<keyof MultiplierResult>>([]);

    useEffect(() => {
        if (item === null) {
            mutation.setData(null);
            setSelectedPlatforms([]);
        }
    }, [item, mutation]);

    if (!item) return null;

    const { loading, error, data: mutationData } = mutation;

    const handleCheckboxChange = (platform: keyof MultiplierResult, checked: boolean) => {
        setSelectedPlatforms(prev => 
            checked ? [...prev, platform] : prev.filter(p => p !== platform)
        );
    };

    const getSourceContent = () => {
        const { type, data, title } = item;
        if (type === 'youtube' || type === 'instagram') {
             const script = data.script || data;
             return { title: script.title || title, hook: script.hook, scenes: script.scenes, cta: script.cta };
        }
        return null;
    };

    const handleMultiply = () => {
        const source_content = getSourceContent();
        if (!source_content) {
            alert("Konten sumber tidak kompatibel untuk dilipatgandakan.");
            return;
        }
        mutation.mutate(
            { function_name: "contentMultiplier", source_content, target_platforms: selectedPlatforms }
        );
    };
    
    const renderResult = (platform: keyof MultiplierResult, result: any) => {
        switch (platform) {
            case 'instagram_carousel':
                const carousel = result as { slides: InstagramCarouselSlide[], caption: string };
                return (
                    <div className="multiplier-result-card">
                        <h5><ReelsIcon /> Instagram Carousel</h5>
                        <div className="carousel-slides">
                            {carousel.slides.map(s => <div key={s.slide_number} className="carousel-slide"><span>{s.slide_number}</span> <p>{s.slide_text}</p></div>)}
                        </div>
                        <h6>Caption</h6>
                        <p>{carousel.caption}</p>
                    </div>
                )
            case 'twitter_thread':
                 const thread = result as { tweets: TwitterThreadTweet[] };
                return (
                    <div className="multiplier-result-card">
                        <h5>Twitter (X) Thread</h5>
                        <div className="twitter-thread">
                            {thread.tweets.map(t => <div key={t.tweet_number} className="tweet-item"><span>{t.tweet_number}</span><p>{t.tweet_text}</p></div>)}
                        </div>
                    </div>
                )
            case 'blog_article':
                const article = result as BlogArticle;
                return (
                    <div className="multiplier-result-card">
                        <h5><BookIcon /> Blog Article</h5>
                        <h3>{article.title}</h3>
                        <p>{article.introduction}</p>
                        <div className="blog-body">{article.body}</div>
                    </div>
                )
            default: return null;
        }
    };

    return (
        <div className={`modal-overlay ${item ? 'visible' : ''}`} onClick={onClose}>
            <div className="modal-content multiplier-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2><MultiplyIcon/> Pengganda Konten</h2>
                    <button onClick={onClose} className="modal-close-button"><CloseIcon /></button>
                </div>
                <div className="modal-body">
                    <p>Ubah konten <strong>"{item.title}"</strong> Anda menjadi format lain. Pilih platform target dan AI akan mengadaptasinya.</p>

                    <div className="platform-checkbox-group">
                        <label>
                            <input type="checkbox" checked={selectedPlatforms.includes('instagram_carousel')} onChange={e => handleCheckboxChange('instagram_carousel', e.target.checked)} />
                            <span>Instagram Carousel</span>
                        </label>
                        <label>
                            <input type="checkbox" checked={selectedPlatforms.includes('twitter_thread')} onChange={e => handleCheckboxChange('twitter_thread', e.target.checked)} />
                            <span>Twitter (X) Thread</span>
                        </label>
                        <label>
                            <input type="checkbox" checked={selectedPlatforms.includes('blog_article')} onChange={e => handleCheckboxChange('blog_article', e.target.checked)} />
                            <span>Blog Article</span>
                        </label>
                    </div>
                    
                     <div className="modal-footer" style={{padding: '0', marginTop: '1rem'}}>
                        <button onClick={handleMultiply} className="submit-button" disabled={loading || selectedPlatforms.length === 0}>
                            <span className="button-text">{loading ? 'Mengadaptasi...' : 'Lipatgandakan Konten'}</span>
                        </button>
                    </div>

                    <div className="multiplier-results-area">
                        {loading && <LoadingSpinner />}
                        {error && <ErrorMessage message={error} />}
                        {mutationData && mutationData.results && (
                             Object.entries(mutationData.results)
                                .map(([platform, result]) => renderResult(platform as keyof MultiplierResult, result))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};