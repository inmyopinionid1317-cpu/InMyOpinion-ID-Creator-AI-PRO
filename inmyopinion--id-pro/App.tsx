/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useCallback, FormEvent, useEffect, useMemo } from 'react';
import { 
    TabType, HistoryItem, PlanInputs, PlanData, YoutubeShortScript, VideoData, InstagramReelsScript,
    GeneratedVisualData, DailyArtifacts, DayPlan, YoutubeInputs, InstagramInputs, TrendFusionResponse,
    TrendIdea, GrowthInsight, PromptStudioResponse, PromptStudioInputs, MultiplierResponse,
    TrendFusionInputs, GeneratedYoutubeVideo, GeneratedReelVisual, KnowledgeSource, PerformanceAnalysisResponse, ChannelAuditInputs
} from './types';
import { callCreatorAi, planSchema, youtubeScriptSchema, instagramReelsScriptSchema, trendFusionIdeasSchema, promptStudioSchema, multiplierSchema, performanceAnalysisSchema, generateImage } from './api';
import { useApiMutation } from './hooks';
import { BackgroundBubbles, BookOpenIcon, GuideModal, PlanIcon, SparklesIcon, TrendIcon, YoutubeIcon, ReelsIcon, AnalyzerIcon, MenuIcon, ConfirmationModal, DashboardIcon, BrainCircuitIcon, LineChartIcon } from './components';
import { 
    ContentPlanGenerator, ShortYoutubeGenerator, InstagramReelsGenerator, TrendFusionGenerator, 
    PerformanceAnalyzer, PromptStudioGenerator, MultiplierModal, DashboardGenerator, KnowledgeHubGenerator
} from './generators';
import { HistoryPanel, sanitizeHistoryState } from './history';
import { exportToDocx, exportToPdf, createAdvancedVeoStylePrompt, createInstagramReelsVisualPrompt, exportVideoAssetsToZip } from './lib';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

// Configure the PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.5.136/build/pdf.worker.mjs`;

const App = () => {
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [activeResultId, setActiveResultId] = useState<string | null>(null);
    const [activePlanData, setActivePlanData] = useState<PlanData | null>(null);
    const [activeTrendData, setActiveTrendData] = useState<TrendFusionResponse | null>(null);
    const [activePromptStudioData, setActivePromptStudioData] = useState<PromptStudioResponse | null>(null);
    const [multiplierItem, setMultiplierItem] = useState<HistoryItem<any, any> | null>(null);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // --- Knowledge Hub State ---
    const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>(() => {
        try {
            const savedSources = localStorage.getItem('creatorAiKnowledgeSources');
            return savedSources ? JSON.parse(savedSources).filter((s: KnowledgeSource) => s.status !== 'processing') : [];
        } catch (error) {
            console.error("Could not load knowledge sources from localStorage", error);
            return [];
        }
    });
    const [selectedKnowledgeSourceId, setSelectedKnowledgeSourceId] = useState<string | null>(null);
    useEffect(() => { localStorage.setItem('creatorAiKnowledgeSources', JSON.stringify(knowledgeSources)); }, [knowledgeSources]);

    const [confirmModalState, setConfirmModalState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
    });


    const [history, setHistory] = useState<{ [key in TabType]: HistoryItem<any, any>[] }>(() => {
        try {
            const savedHistory = localStorage.getItem('creatorAiHistory');
            const parsed = savedHistory ? JSON.parse(savedHistory) : { dashboard: [], plan: [], youtube: [], instagram: [], trend: [], analyzer: [], prompt_studio: [], knowledge_hub: [] };
            return sanitizeHistoryState(parsed);
        } catch (error) { 
            console.error("Could not load or sanitize history from localStorage", error); 
            return { dashboard: [], plan: [], youtube: [], instagram: [], trend: [], analyzer: [], prompt_studio: [], knowledge_hub: [] }; 
        }
    });

    const [sourcePlanId, setSourcePlanId] = useState<string | null>(() => {
        try {
            const savedHistory = localStorage.getItem('creatorAiHistory');
            if (!savedHistory) return null;
            const parsed = JSON.parse(savedHistory);
            const sanitized = sanitizeHistoryState(parsed);
            const sortedPlans = [...(sanitized.plan || [])].sort((a,b) => b.timestamp - a.timestamp);
            return sortedPlans.length > 0 ? sortedPlans[0].id : null;
        } catch (error) { 
            console.error("Could not get initial source plan from localStorage", error); 
            return null;
        }
    });

    const [generatedVideo, setGeneratedVideo] = useState<VideoData | null>(null);
    const [videoLoading, setVideoLoading] = useState(false);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [videoProgress, setVideoProgress] = useState(0);
    const [isDownloadingVideo, setIsDownloadingVideo] = useState(false);
    
    const [generatedInstagramVisual, setGeneratedInstagramVisual] = useState<GeneratedVisualData | null>(null);
    const [instagramVisualLoading, setInstagramVisualLoading] = useState(false);
    const [instagramVisualError, setInstagramVisualError] = useState<string | null>(null);


    useEffect(() => { localStorage.setItem('creatorAiHistory', JSON.stringify(history)); }, [history]);
    
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsHistoryVisible(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setIsHistoryVisible(false);
    }, [activeTab]);
    
    const selectedKnowledgeSourceContent = useMemo(() => {
        if (!selectedKnowledgeSourceId) return null;
        const source = knowledgeSources.find(s => s.id === selectedKnowledgeSourceId);
        return source ? source.content : null;
    }, [selectedKnowledgeSourceId, knowledgeSources]);

    const generatePlanApi = useCallback(async (variables: PlanInputs, sourceDocumentContent: string | null): Promise<PlanData> => {
        const response = await callCreatorAi<PlanData>({ function_name: "generateContentPlan", ...variables }, planSchema, sourceDocumentContent);
        return { plan: response.plan, daily_artifacts: {} };
    }, []);
    const planMutation = useApiMutation<PlanData, PlanInputs>(generatePlanApi);
    const youtubeScriptMutation = useApiMutation<YoutubeShortScript, any>((variables, sourceDocumentContent) => callCreatorAi<YoutubeShortScript>({ function_name: "generateYoutubeShortScript", ...variables }, youtubeScriptSchema, sourceDocumentContent));
    const reelsScriptMutation = useApiMutation<InstagramReelsScript, any>((variables, sourceDocumentContent) => callCreatorAi<InstagramReelsScript>({ function_name: "generateInstagramReelsScript", ...variables }, instagramReelsScriptSchema, sourceDocumentContent));
    const trendFusionMutation = useApiMutation<TrendFusionResponse, TrendFusionInputs>((variables, sourceDocumentContent) => callCreatorAi<TrendFusionResponse>({ function_name: "generateTrendFusionIdeas", ...variables }, trendFusionIdeasSchema, sourceDocumentContent));
    const promptStudioMutation = useApiMutation<PromptStudioResponse, PromptStudioInputs>((variables, sourceDocumentContent) => callCreatorAi<PromptStudioResponse>({ function_name: "generateTailoredPrompts", ...variables }, promptStudioSchema, sourceDocumentContent));
    const multiplierMutation = useApiMutation<MultiplierResponse, any>((variables, sourceDocumentContent) => callCreatorAi<MultiplierResponse>(variables, multiplierSchema, sourceDocumentContent));
    const performanceAnalysisMutation = useApiMutation<PerformanceAnalysisResponse, any>((variables, sourceDocumentContent) => callCreatorAi<PerformanceAnalysisResponse>(variables, performanceAnalysisSchema, sourceDocumentContent));
    const channelAuditMutation = useApiMutation<PerformanceAnalysisResponse, ChannelAuditInputs>((variables) => callCreatorAi<PerformanceAnalysisResponse>({ function_name: "channelAudit", ...variables }, performanceAnalysisSchema, null));


    const findHistoryItem = useCallback((id: string | null): HistoryItem<any, any> | null => {
        if (!id) return null;
        return Object.values(history).flat().find(item => item.id === id) || null;
    }, [history]);
    
    const activeHistoryItem = useMemo(() => findHistoryItem(activeResultId), [findHistoryItem, activeResultId]);

    const activeInputs = useMemo(() => {
        if (!activeHistoryItem) return {};
        if (activeHistoryItem.type === activeTab) {
            return activeHistoryItem.inputs;
        }
        return {};
    }, [activeHistoryItem, activeTab]);
    
    const sourcePlanForSubGenerators = useMemo(() => {
        if (!sourcePlanId) return null;
        const plan = findHistoryItem(sourcePlanId);
        return plan && plan.type === 'plan' ? plan : null;
    }, [sourcePlanId, findHistoryItem]);

    const allPlans = useMemo(() =>
        [...history.plan].sort((a, b) => b.timestamp - a.timestamp),
        [history.plan]
    );

    const updateHistoryItem = (id: string, updates: Partial<HistoryItem<any, any>>) => {
        const item = findHistoryItem(id);
        if (!item) return;
        setHistory(prev => ({
            ...prev,
            [item.type]: prev[item.type].map(h => h.id === id ? { ...h, ...updates } : h)
        }));
    };

    const updateDailyArtifact = useCallback((planId: string, dayNumber: number, artifactKey: keyof DailyArtifacts, artifactData: any) => {
        const item = findHistoryItem(planId);
        if (!item || item.type !== 'plan') return;

        const newPlanData = JSON.parse(JSON.stringify(item.data));
        
        if (!newPlanData.daily_artifacts) newPlanData.daily_artifacts = {};
        if (!newPlanData.daily_artifacts[dayNumber]) newPlanData.daily_artifacts[dayNumber] = {};
        
        newPlanData.daily_artifacts[dayNumber][artifactKey] = artifactData;
        
        updateHistoryItem(planId, { data: newPlanData });
        
        if (planId === activeResultId) {
            setActivePlanData(newPlanData);
        }
    }, [findHistoryItem, activeResultId]);

    const handleAddHistory = (type: TabType, inputs: any, data: any, title: string): string => {
        const newId = Date.now().toString();
        const newItem: HistoryItem<any, any> = { id: newId, type, timestamp: Date.now(), inputs, data, title, pinned: false };
        setHistory(prev => ({ ...prev, [type]: [newItem, ...prev[type]] }));
        setActiveResultId(newId);
        return newId;
    };
    
    const clearAllLiveResults = useCallback(() => {
        planMutation.setData(null);
        planMutation.setError(null);
        youtubeScriptMutation.setData(null);
        youtubeScriptMutation.setError(null);
        reelsScriptMutation.setData(null);
        reelsScriptMutation.setError(null);
        trendFusionMutation.setData(null);
        trendFusionMutation.setError(null);
        performanceAnalysisMutation.setData(null);
        performanceAnalysisMutation.setError(null);
        channelAuditMutation.setData(null);
        channelAuditMutation.setError(null);
        promptStudioMutation.setData(null);
        promptStudioMutation.setError(null);
        
        setActivePlanData(null);
        setActiveTrendData(null);
        setActivePromptStudioData(null);
        setGeneratedVideo(null);
        setVideoError(null);
        setGeneratedInstagramVisual(null);
        setInstagramVisualError(null);

    }, [planMutation, youtubeScriptMutation, reelsScriptMutation, trendFusionMutation, performanceAnalysisMutation, channelAuditMutation, promptStudioMutation]);

    // --- Knowledge Hub Logic ---
    const handleKnowledgeSourceAdd = async (files: FileList) => {
        const newSources: KnowledgeSource[] = Array.from(files).map(file => ({
            id: `${file.name}-${file.lastModified}`,
            name: file.name,
            content: '',
            status: 'processing',
            fileType: file.type || 'unknown'
        }));

        setKnowledgeSources(prev => [...prev.filter(s => !newSources.some(ns => ns.id === s.id)), ...newSources]);

        for (const file of files) {
            const sourceId = `${file.name}-${file.lastModified}`;
            try {
                let text = '';
                if (file.type === 'text/plain') {
                    text = await file.text();
                } else if (file.type === 'application/pdf') {
                    const buffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        text += textContent.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
                    }
                } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // .docx
                    const buffer = await file.arrayBuffer();
                    const zip = await JSZip.loadAsync(buffer);
                    const content = await zip.file('word/document.xml')?.async('string');
                    if (content) {
                        const parser = new DOMParser();
                        const xmlDoc = parser.parseFromString(content, "application/xml");
                        const textNodes = xmlDoc.getElementsByTagName('w:t');
                        for (let i = 0; i < textNodes.length; i++) {
                            text += textNodes[i].textContent + ' ';
                        }
                    }
                } else if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') { // .pptx
                    const buffer = await file.arrayBuffer();
                    const zip = await JSZip.loadAsync(buffer);
                    const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
                    const slidePromises = slideFiles.map(fileName => zip.file(fileName)!.async('string'));
                    const slideContents = await Promise.all(slidePromises);
                    const parser = new DOMParser();
                    for (const slideContent of slideContents) {
                        const xmlDoc = parser.parseFromString(slideContent, "application/xml");
                        const textNodes = xmlDoc.getElementsByTagName('a:t');
                        for (let i = 0; i < textNodes.length; i++) {
                            text += textNodes[i].textContent + ' ';
                        }
                    }
                } else {
                    throw new Error(`Unsupported file type: ${file.type || 'unknown'}`);
                }

                setKnowledgeSources(prev => prev.map(s => s.id === sourceId ? { ...s, status: 'ready', content: text.trim() } : s));
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error during file processing';
                console.error(`Failed to process ${file.name}:`, err);
                setKnowledgeSources(prev => prev.map(s => s.id === sourceId ? { ...s, status: 'error', errorMessage } : s));
            }
        }
    };
    
    const handleKnowledgeSourceDelete = (id: string) => {
        setKnowledgeSources(prev => prev.filter(s => s.id !== id));
        if (selectedKnowledgeSourceId === id) {
            setSelectedKnowledgeSourceId(null);
        }
    };

    // --- End Knowledge Hub Logic ---

    const handlePlanSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const variables = Object.fromEntries(formData.entries()) as unknown as PlanInputs;
        clearAllLiveResults();
        setActiveResultId(null);
        planMutation.mutate(variables, (newData) => {
            const newPlanId = handleAddHistory('plan', variables, newData, `Plan: ${variables.topic || 'Untitled Plan'}`);
            setSourcePlanId(newPlanId);
            setActivePlanData(newData);
        }, selectedKnowledgeSourceContent);
    };
    
    const handlePlanRegenerate = () => {
        if (!activeHistoryItem?.inputs) return;
        clearAllLiveResults();
        setActiveResultId(null);
        planMutation.mutate(activeHistoryItem.inputs, (newData) => {
            const newPlanId = handleAddHistory('plan', activeHistoryItem.inputs, newData, `Plan: ${activeHistoryItem.inputs.topic || 'Untitled Plan'} (Regen)`);
            setSourcePlanId(newPlanId);
            setActivePlanData(newData);
        }, selectedKnowledgeSourceContent);
    };
    
    const handlePromptStudioSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const variables = {
            base_idea: formData.get('base_idea') as string,
            target_ai: formData.get('target_ai') as string,
            modifiers: formData.getAll('modifiers') as string[]
        };
        clearAllLiveResults();
        setActiveResultId(null);
        promptStudioMutation.mutate(variables, (newData) => {
            handleAddHistory('prompt_studio', variables, newData, `Prompt: ${variables.base_idea.substring(0, 30)}...`);
            setActivePromptStudioData(newData);
        }, selectedKnowledgeSourceContent);
    };

    const handleSelectHistory = (id: string) => {
        const item = findHistoryItem(id);
        if (!item) return;

        clearAllLiveResults();
        setActiveTab(item.type);
        setActiveResultId(id);
        setIsHistoryVisible(false); // Close panel on selection
        setSearchQuery(''); // Clear search on selection

        if (item.type === 'plan') {
            setActivePlanData(item.data);
            setSourcePlanId(id); // Also set this as the active source plan
        } else if (item.type === 'youtube') {
            if (item.data.script && item.data.scene_images) {
                youtubeScriptMutation.setData(null);
                setGeneratedVideo(item.data);
            } else {
                youtubeScriptMutation.setData(item.data);
                setGeneratedVideo(null);
            }
        } else if (item.type === 'instagram') {
             if (item.data.script && item.data.visual) {
                reelsScriptMutation.setData(item.data.script);
                setGeneratedInstagramVisual(item.data.visual);
            } else {
                reelsScriptMutation.setData(item.data);
                setGeneratedInstagramVisual(null);
            }
        } else if (item.type === 'trend') {
            setActiveTrendData(item.data);
        } else if (item.type === 'prompt_studio') {
            setActivePromptStudioData(item.data);
        } else if (item.type === 'analyzer') {
            // Data for analyzer is handled by passing initialData to the component
        }
    };

    const handleRenameHistory = (id: string, newTitle: string) => {
        updateHistoryItem(id, { title: newTitle });
    };

    const handlePinHistory = (id: string) => {
        const item = findHistoryItem(id);
        if (item) {
            updateHistoryItem(id, { pinned: !item.pinned });
        }
    };
    
    const handleDownloadHistory = async (item: HistoryItem<any, any>, type: 'docx' | 'pdf') => {
        try {
            if (type === 'docx') {
                await exportToDocx(item);
            } else {
                exportToPdf(item);
            }
        } catch (error) {
            console.error(`Failed to export ${type}`, error);
            alert(`Could not export to ${type}. See console for details.`);
        }
    };

    const handleDeleteHistory = (id: string) => {
        const item = findHistoryItem(id);
        if (!item) return;

        setConfirmModalState({
            isOpen: true,
            title: "Konfirmasi Hapus",
            message: `Apakah Anda yakin ingin menghapus "${item.title}"? Tindakan ini tidak dapat dibatalkan.`,
            onConfirm: () => {
                setHistory(prev => ({
                    ...prev,
                    [item.type]: prev[item.type].filter(h => h.id !== id)
                }));
                if (activeResultId === id) {
                    clearAllLiveResults();
                    setActiveResultId(null);
                }
                if (sourcePlanId === id) {
                    const newestPlan = allPlans.filter(p => p.id !== id)[0];
                    setSourcePlanId(newestPlan ? newestPlan.id : null);
                }
                setConfirmModalState({ ...confirmModalState, isOpen: false });
            }
        });
    };

    const handleClearHistory = () => {
        if (activeTab === 'analyzer' || activeTab === 'knowledge_hub' || history[activeTab].length === 0) return;
        const tabDisplayName: { [key in TabType]: string } = { dashboard: 'Dasbor', plan: 'Content Plan', youtube: 'Short Youtube', instagram: 'Instagram Reels', trend: 'Trend Fusion', analyzer: 'Analyzer', prompt_studio: 'Prompt Studio', knowledge_hub: 'Pusat Pengetahuan' };

        setConfirmModalState({
            isOpen: true,
            title: `Hapus Semua Riwayat ${tabDisplayName[activeTab]}`,
            message: `Apakah Anda yakin ingin menghapus semua riwayat untuk tab ${tabDisplayName[activeTab]}? Tindakan ini tidak dapat dibatalkan.`,
            onConfirm: () => {
                setHistory(prev => ({ ...prev, [activeTab]: [] }));
                if (activeHistoryItem?.type === activeTab) {
                    clearAllLiveResults();
                    setActiveResultId(null);
                }
                if (activeTab === 'plan') {
                    setSourcePlanId(null);
                }
                setConfirmModalState({ ...confirmModalState, isOpen: false });
            }
        });
    };
    
    const handleGenerateYoutubeScript = (day: DayPlan, planData: PlanData, planId: string) => {
        const sourcePlanItem = findHistoryItem(planId);
        if (!sourcePlanItem) {
            alert("Could not find the source content plan.");
            return;
        }

        const variables = {
            theme: day.theme,
            content_idea: day.content_idea,
            target_audience: sourcePlanItem.inputs.target_audience
        };
        clearAllLiveResults();
        youtubeScriptMutation.mutate(variables, (newData) => {
            const newInputs: YoutubeInputs = { selectedDay: day.day.toString(), planId, planInputs: sourcePlanItem.inputs };
            handleAddHistory('youtube', newInputs, newData, `YT Short: ${day.content_idea}`);
        }, selectedKnowledgeSourceContent);
    };
    
    const handleGenerateYoutubeVideo = (script: YoutubeShortScript, method: 'standard' | 'veo') => {
        if (!Array.isArray(script.scenes) || !activeResultId) return;
        setVideoLoading(true);
        setVideoError(null);
        setVideoProgress(0);
        
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 100 / (script.scenes.length * 2); // Approximation
            setVideoProgress(Math.min(progress, 99));
        }, 500);

        Promise.all(script.scenes.map(scene => {
            const prompt = method === 'veo' ? createAdvancedVeoStylePrompt(scene.visual_description) : scene.visual_description;
            return generateImage(prompt, { aspectRatio: '9:16' });
        })).then(imageResults => {
            const scene_images = imageResults.map((result, index) => {
                if (!result.generatedImages || result.generatedImages.length === 0) throw new Error(`Image generation failed for scene ${index + 1}`);
                return { imageUrl: `data:image/jpeg;base64,${result.generatedImages[0].image.imageBytes}`, prompt: script.scenes[index].visual_description };
            });
            const videoData: GeneratedYoutubeVideo = { script, scene_images, generationMethod: method };
            setGeneratedVideo(videoData);
            updateHistoryItem(activeResultId, { data: videoData });
        }).catch(err => {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during video generation.";
            setVideoError(errorMessage);
        }).finally(() => {
            clearInterval(progressInterval);
            setVideoProgress(100);
            setTimeout(() => setVideoLoading(false), 500);
        });
    };
    
    const handleDownloadVideo = async (videoData: VideoData) => {
        if (isDownloadingVideo) return;
        setIsDownloadingVideo(true);
        try {
            await exportVideoAssetsToZip(videoData);
        } catch (error) {
            console.error("Failed to create video assets ZIP:", error);
            alert(`An error occurred while creating the ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsDownloadingVideo(false);
        }
    };
    
    const handleGenerateReelsScript = (day: DayPlan, planData: PlanData, planId: string) => {
        const sourcePlanItem = findHistoryItem(planId);
        if (!sourcePlanItem) {
            alert("Could not find the source content plan.");
            return;
        }

        const variables = {
            theme: day.theme,
            content_idea: day.content_idea,
            target_audience: sourcePlanItem.inputs.target_audience
        };
        clearAllLiveResults();
        reelsScriptMutation.mutate(variables, (newData) => {
            const newInputs: InstagramInputs = { selectedDay: day.day.toString(), planId, planInputs: sourcePlanItem.inputs };
            handleAddHistory('instagram', newInputs, newData, `Reel: ${day.content_idea}`);
        }, selectedKnowledgeSourceContent);
    };

    const handleGenerateReelVisual = (script: InstagramReelsScript, method: 'standard' | 'veo') => {
        if (!activeResultId) return;

        const scriptHistoryItem = findHistoryItem(activeResultId);
        if (!scriptHistoryItem || scriptHistoryItem.type !== 'instagram') {
            alert("Could not find the active script in history.");
            return;
        }
        
        const inputs = scriptHistoryItem.inputs as InstagramInputs;
        if (!inputs.planInputs || !inputs.planInputs.niche || !inputs.planInputs.target_audience) {
            alert("Could not find niche and audience context for this script. Please ensure the source plan was saved correctly.");
            return;
        }

        const { niche: theme, target_audience } = inputs.planInputs;

        setInstagramVisualLoading(true);
        setInstagramVisualError(null);

        const basePrompt = createInstagramReelsVisualPrompt(script, theme, target_audience);
        const finalPrompt = method === 'veo' ? createAdvancedVeoStylePrompt(basePrompt) : basePrompt;

        generateImage(finalPrompt, { aspectRatio: '9:16' })
        .then(response => {
            if (!response.generatedImages || response.generatedImages.length === 0) throw new Error("Image generation failed for Instagram visual.");
            
            const visual: GeneratedVisualData = {
                imageUrl: `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`,
                prompt: finalPrompt,
                generationMethod: method
            };

            const fullReelData: GeneratedReelVisual = {
                script,
                visual,
                generationMethod: method
            };
            
            setGeneratedInstagramVisual(visual);
            updateHistoryItem(activeResultId, { data: fullReelData });

        }).catch(err => {
             const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during visual generation.";
            setInstagramVisualError(errorMessage);
        }).finally(() => {
            setInstagramVisualLoading(false);
        });
    };
    
    const handleAnalyzeTrends = (manualInputs?: TrendFusionInputs) => {
        let variables: TrendFusionInputs | null = null;
        let title = '';
        let newInputs: TrendFusionInputs & { planId?: string } = { niche: '', target_audience: '' };

        if (manualInputs && manualInputs.niche && manualInputs.target_audience) {
            variables = manualInputs;
            title = `Trends for: ${manualInputs.niche}`;
            newInputs = manualInputs;
        } else {
            if (!sourcePlanForSubGenerators) {
                alert("Harap pilih Rencana Konten yang valid atau isi detail manual terlebih dahulu.");
                return;
            }
            const { niche, target_audience } = sourcePlanForSubGenerators.inputs;
            if (!niche || !target_audience) {
                alert("Rencana Konten sumber tidak memiliki Niche atau Target Audiens.");
                return;
            }
            variables = { niche, target_audience };
            title = `Trends for: ${niche}`;
            newInputs = { ...variables, planId: sourcePlanId! };
        }
        
        clearAllLiveResults();
        setActiveResultId(null);
        
        trendFusionMutation.mutate(variables, (newData) => {
            handleAddHistory('trend', newInputs, newData, title);
            setActiveTrendData(newData);
        }, selectedKnowledgeSourceContent);
    };
    
    const handleCreateScriptFromFusionIdea = (idea: TrendIdea, platform: 'youtube' | 'instagram') => {
        let niche = '';
        let target_audience = '';
        let planId: string | undefined = undefined;
        let planInputs: PlanInputs | undefined = undefined;

        if (activeHistoryItem && activeHistoryItem.type === 'trend' && activeHistoryItem.inputs) {
            const trendHistoryInputs = activeHistoryItem.inputs as TrendFusionInputs & { planId?: string };
            niche = trendHistoryInputs.niche;
            target_audience = trendHistoryInputs.target_audience;
            planId = trendHistoryInputs.planId;
            
            if (planId) {
                const sourcePlanItem = findHistoryItem(planId);
                if (sourcePlanItem) {
                    planInputs = sourcePlanItem.inputs;
                }
            }
        } 
        else if (sourcePlanForSubGenerators) {
            niche = sourcePlanForSubGenerators.inputs.niche;
            target_audience = sourcePlanForSubGenerators.inputs.target_audience;
            planId = sourcePlanForSubGenerators.id;
            planInputs = sourcePlanForSubGenerators.inputs;
        }
        else {
            alert("Could not find the source data (Plan or Manual Inputs) for this trend. Please try selecting the plan again or re-analyzing.");
            return;
        }

        if (!niche || !target_audience) {
            alert("Niche or Target Audience is missing. Cannot generate script.");
            return;
        }

        const variables = {
            theme: niche, 
            content_idea: idea.fused_idea_title,
            target_audience: target_audience
        };

        clearAllLiveResults();
        
        if (platform === 'youtube') {
            setActiveTab('youtube');
            youtubeScriptMutation.mutate(variables, (newData) => {
                const newInputs: YoutubeInputs = { selectedDay: 'fused', planId, planInputs };
                handleAddHistory('youtube', newInputs, newData, `YT Short: ${idea.fused_idea_title}`);
            }, selectedKnowledgeSourceContent);
        } else {
            setActiveTab('instagram');
            reelsScriptMutation.mutate(variables, (newData) => {
                const newInputs: InstagramInputs = { selectedDay: 'fused', planId, planInputs };
                handleAddHistory('instagram', newInputs, newData, `Reel: ${idea.fused_idea_title}`);
            }, selectedKnowledgeSourceContent);
        }
    };
    
    const handleCreateScriptFromInsight = (idea: GrowthInsight['actionable_idea']) => {
        if (!sourcePlanForSubGenerators && !idea.theme) {
            alert("No source content plan found or theme specified in idea. Please select a plan or ensure the idea has a theme.");
            return;
        }

        const inputs = sourcePlanForSubGenerators?.inputs;
        const planId = sourcePlanForSubGenerators?.id;
    
        const variables = {
            theme: idea.theme || inputs!.niche,
            content_idea: idea.content_idea,
            target_audience: inputs?.target_audience || "General Audience"
        };
    
        clearAllLiveResults();
    
        const platform = idea.type.includes('youtube') ? 'youtube' : 'instagram';
    
        if (platform === 'youtube') {
            setActiveTab('youtube');
            youtubeScriptMutation.mutate(variables, (newData) => {
                const newInputs: YoutubeInputs = { selectedDay: 'insight', planId, planInputs: inputs };
                handleAddHistory('youtube', newInputs, newData, `YT Short (Insight): ${idea.content_idea}`);
            }, selectedKnowledgeSourceContent);
        } else {
            setActiveTab('instagram');
            reelsScriptMutation.mutate(variables, (newData) => {
                const newInputs: InstagramInputs = { selectedDay: 'insight', planId, planInputs: inputs };
                handleAddHistory('instagram', newInputs, newData, `Reel (Insight): ${idea.content_idea}`);
            }, selectedKnowledgeSourceContent);
        }
    };

    const handleBackToYoutubeStoryboard = () => {
        setGeneratedVideo(null);
    };

    const handleBackToReelsStoryboard = () => {
        setGeneratedInstagramVisual(null);
    };


    const handleOpenMultiplier = (item: HistoryItem<any, any>) => {
        setMultiplierItem(item);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <DashboardGenerator 
                    history={history}
                    onSelectHistoryItem={handleSelectHistory}
                />;
            case 'knowledge_hub':
                return <KnowledgeHubGenerator 
                    knowledgeSources={knowledgeSources}
                    onAddFiles={handleKnowledgeSourceAdd}
                    onDeleteSource={handleKnowledgeSourceDelete}
                />;
            case 'plan':
                return <ContentPlanGenerator 
                    planData={activePlanData}
                    inputs={activeInputs} 
                    onSubmit={handlePlanSubmit}
                    onRegenerate={handlePlanRegenerate}
                    loading={planMutation.loading}
                    error={planMutation.error}
                    progress={planMutation.progress}
                    planId={activeResultId}
                    onUpdateArtifact={updateDailyArtifact}
                    knowledgeSources={knowledgeSources}
                    selectedKnowledgeSourceId={selectedKnowledgeSourceId}
                    onSelectKnowledgeSource={setSelectedKnowledgeSourceId}
                />;
            case 'youtube':
                return <ShortYoutubeGenerator
                    allPlans={allPlans}
                    selectedPlanId={sourcePlanId}
                    onSelectPlan={setSourcePlanId}
                    sourcePlan={sourcePlanForSubGenerators}
                    scriptMutation={youtubeScriptMutation}
                    videoData={generatedVideo}
                    onGenerateScript={handleGenerateYoutubeScript}
                    onGenerateVideo={handleGenerateYoutubeVideo}
                    videoLoading={videoLoading}
                    videoError={videoError}
                    videoProgress={videoProgress}
                    onDownloadVideo={handleDownloadVideo}
                    isDownloadingVideo={isDownloadingVideo}
                    onBackToStoryboard={handleBackToYoutubeStoryboard}
                    knowledgeSources={knowledgeSources}
                    selectedKnowledgeSourceId={selectedKnowledgeSourceId}
                    onSelectKnowledgeSource={setSelectedKnowledgeSourceId}
                />;
            case 'instagram':
                 return <InstagramReelsGenerator
                    allPlans={allPlans}
                    selectedPlanId={sourcePlanId}
                    onSelectPlan={setSourcePlanId}
                    sourcePlan={sourcePlanForSubGenerators}
                    scriptMutation={reelsScriptMutation}
                    visualData={generatedInstagramVisual}
                    onGenerateScript={handleGenerateReelsScript}
                    onGenerateVisual={handleGenerateReelVisual}
                    visualLoading={instagramVisualLoading}
                    visualError={instagramVisualError}
                    onBackToStoryboard={handleBackToReelsStoryboard}
                    knowledgeSources={knowledgeSources}
                    selectedKnowledgeSourceId={selectedKnowledgeSourceId}
                    onSelectKnowledgeSource={setSelectedKnowledgeSourceId}
                />;
            case 'trend':
                return <TrendFusionGenerator 
                    allPlans={allPlans}
                    selectedPlanId={sourcePlanId}
                    onSelectPlan={setSourcePlanId}
                    sourcePlan={sourcePlanForSubGenerators}
                    trendData={activeTrendData || trendFusionMutation.data}
                    onAnalyze={handleAnalyzeTrends}
                    loading={trendFusionMutation.loading}
                    error={trendFusionMutation.error}
                    progress={trendFusionMutation.progress}
                    onCreateScriptFromIdea={handleCreateScriptFromFusionIdea}
                    knowledgeSources={knowledgeSources}
                    selectedKnowledgeSourceId={selectedKnowledgeSourceId}
                    onSelectKnowledgeSource={setSelectedKnowledgeSourceId}
                />;
            case 'analyzer':
                return <PerformanceAnalyzer
                    allPlans={allPlans}
                    selectedPlanId={sourcePlanId}
                    onSelectPlan={setSourcePlanId}
                    sourcePlan={sourcePlanForSubGenerators}
                    onUpdateArtifact={updateDailyArtifact}
                    analysisMutation={performanceAnalysisMutation}
                    channelAuditMutation={channelAuditMutation}
                    onCreateScriptFromInsight={handleCreateScriptFromInsight}
                    onAddHistory={handleAddHistory}
                    initialData={activeHistoryItem?.type === 'analyzer' ? activeHistoryItem.data : null}
                />;
            case 'prompt_studio':
                return <PromptStudioGenerator
                    promptData={activePromptStudioData || promptStudioMutation.data}
                    inputs={activeInputs as Partial<PromptStudioInputs>}
                    onSubmit={handlePromptStudioSubmit}
                    loading={promptStudioMutation.loading}
                    error={promptStudioMutation.error}
                    progress={promptStudioMutation.progress}
                    knowledgeSources={knowledgeSources}
                    selectedKnowledgeSourceId={selectedKnowledgeSourceId}
                    onSelectKnowledgeSource={setSelectedKnowledgeSourceId}
                />;
            default:
                return null;
        }
    };
    
    return (
        <div className="app-wrapper">
            <BackgroundBubbles />
            {!isHistoryVisible &&
                <button className="menu-toggle-button" onClick={() => setIsHistoryVisible(true)} aria-label="Toggle History Panel">
                    <MenuIcon />
                </button>
            }
            <div className={`app-overlay ${isHistoryVisible ? 'visible' : ''}`} onClick={() => setIsHistoryVisible(false)}></div>
            <HistoryPanel
                history={history}
                activeTab={activeTab}
                onSelect={handleSelectHistory}
                onRename={handleRenameHistory}
                onPin={handlePinHistory}
                onDownload={handleDownloadHistory}
                onDelete={handleDeleteHistory}
                onClear={handleClearHistory}
                onMultiply={handleOpenMultiplier}
                activeId={activeResultId}
                isVisible={isHistoryVisible}
                onClose={() => setIsHistoryVisible(false)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />
            <main className="app-container">
                <div className="sticky-header-container">
                    <header>
                        <h1>InMyOpinion-ID Creator AI <sup>PRO</sup></h1>
                        <p>Your <b>Ultimate Expert Assistant</b> for <b>Mastering</b> Digital Content Creation Management</p>
                        <p>By <b>Ikhsan Muharramsyah</b></p>
                    </header>
                    <nav className="tabs">
                        <button className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><DashboardIcon /> Dasbor</button>
                        <button className={`tab-button ${activeTab === 'knowledge_hub' ? 'active' : ''}`} onClick={() => setActiveTab('knowledge_hub')}><BrainCircuitIcon /> Pusat Pengetahuan</button>
                        <button className={`tab-button ${activeTab === 'plan' ? 'active' : ''}`} onClick={() => setActiveTab('plan')}><PlanIcon /> Content Plan</button>
                        <button className={`tab-button ${activeTab === 'prompt_studio' ? 'active' : ''}`} onClick={() => setActiveTab('prompt_studio')}><SparklesIcon /> Prompt Studio</button>
                        <button className={`tab-button ${activeTab === 'trend' ? 'active' : ''}`} onClick={() => setActiveTab('trend')}><TrendIcon /> Trend Fusion</button>
                        <button className={`tab-button ${activeTab === 'youtube' ? 'active' : ''}`} onClick={() => setActiveTab('youtube')}><YoutubeIcon /> Short Youtube</button>
                        <button className={`tab-button ${activeTab === 'instagram' ? 'active' : ''}`} onClick={() => setActiveTab('instagram')}><ReelsIcon /> Instagram Reels</button>
                        <button className={`tab-button ${activeTab === 'analyzer' ? 'active' : ''}`} onClick={() => setActiveTab('analyzer')}><AnalyzerIcon /> AI-Powered Analyzer</button>
                    </nav>
                </div>
                <div className="main-content">
                    {renderContent()}
                </div>
            </main>
             <MultiplierModal 
                item={multiplierItem} 
                onClose={() => setMultiplierItem(null)}
                mutation={multiplierMutation}
                onSuccess={(type, data, title) => { handleAddHistory(type, multiplierItem?.inputs, data, title) }}
            />
             <button className="fab-guide-button" onClick={() => setIsGuideOpen(true)} aria-label="Buka Panduan Cepat">
                <BookOpenIcon />
                <span>Panduan</span>
            </button>
            <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
            <ConfirmationModal
                isOpen={confirmModalState.isOpen}
                onClose={() => setConfirmModalState({ ...confirmModalState, isOpen: false })}
                onConfirm={confirmModalState.onConfirm}
                title={confirmModalState.title}
                message={confirmModalState.message}
            />
        </div>
    );
};

export default App;
