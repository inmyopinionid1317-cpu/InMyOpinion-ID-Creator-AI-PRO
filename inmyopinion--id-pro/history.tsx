/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HistoryItem, TabType, PlanInputs, PlanData } from './types';
import { 
    EditIcon, PinIcon, WordIcon, PdfIcon, TrashIcon, MoreVerticalIcon, MultiplyIcon,
    PlanIcon, YoutubeIcon, ReelsIcon, TrendIcon, AnalyzerIcon, SparklesIcon, CloseIcon, SearchIcon, DashboardIcon, BrainCircuitIcon
} from './components';

export const sanitizeHistoryState = (loadedHistory: any): { [key in TabType]: HistoryItem<any, any>[] } => {
    const sanitized: { [key in TabType]: HistoryItem<any, any>[] } = { dashboard: [], plan: [], youtube: [], instagram: [], trend: [], analyzer: [], prompt_studio: [], knowledge_hub: [] };
    const tabs: TabType[] = ['dashboard', 'plan', 'youtube', 'instagram', 'trend', 'analyzer', 'prompt_studio', 'knowledge_hub'];

    tabs.forEach(tab => {
        if (tab === 'analyzer' || tab === 'dashboard' || tab === 'knowledge_hub') return;
        const key = tab === 'instagram' ? 'artistic' : tab; // Handle migration from 'artistic'
        const source = loadedHistory[key] || loadedHistory[tab];

        if (Array.isArray(source)) {
            sanitized[tab] = source.map((item: any) => {
                const type = item.type === 'artistic' ? 'instagram' : (item.type ?? tab);
                const sanitizedItem = {
                    ...item,
                    id: item.id ?? Date.now().toString() + Math.random(),
                    type: type,
                    timestamp: item.timestamp ?? Date.now(),
                    inputs: item.inputs ?? {},
                    data: item.data ?? {},
                    title: item.title ?? 'Untitled Result',
                    pinned: item.pinned ?? false, 
                };

                // Migrate plan data to new structure with daily_artifacts
                if (sanitizedItem.type === 'plan' && sanitizedItem.data) {
                    if (sanitizedItem.data.plan && sanitizedItem.data.daily_artifacts === undefined) {
                        sanitizedItem.data.daily_artifacts = {};
                    }
                }

                return sanitizedItem;
            }).filter((item: any) => item && item.id && item.data);
        }
    });

    return sanitized;
};


const HistoryItemActions = ({ item, onRename, onPin, onDownload, onDelete, onMultiply }: { item: HistoryItem<any, any>, onRename: () => void, onPin: () => void, onDownload: (type: 'docx' | 'pdf') => void, onDelete: () => void, onMultiply: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const toggleMenu = (e: React.MouseEvent) => { e.stopPropagation(); setIsOpen(prev => !prev); };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const createActionHandler = (action: () => void) => (e: React.MouseEvent) => {
        e.stopPropagation();
        action();
        setIsOpen(false);
    };
    
    // The "Multiply" feature is only designed for script-based content.
    const isMultipliable = item.type === 'youtube' || item.type === 'instagram';

    return (
        <div className="history-item-actions-container">
            {isMultipliable && (
                <button 
                    className="history-item-multiply-button"
                    onClick={(e) => { e.stopPropagation(); onMultiply(); }}
                    aria-label="Multiply this content"
                    title="Multiply Content"
                >
                    <MultiplyIcon />
                </button>
            )}
            <button className="history-item-actions-button" onClick={toggleMenu} aria-label="More actions"><MoreVerticalIcon/></button>
            {isOpen && (
                <div className="history-actions-menu" ref={menuRef}>
                    <button onClick={createActionHandler(onRename)}><EditIcon/> Rename</button>
                    <button onClick={createActionHandler(onPin)}><PinIcon isPinned={!!item.pinned}/> {item.pinned ? 'Unpin' : 'Pin'}</button>
                    <button onClick={createActionHandler(() => onDownload('docx'))}><WordIcon/> Download .docx</button>
                    <button onClick={createActionHandler(() => onDownload('pdf'))}><PdfIcon/> Download .pdf</button>
                    <button onClick={createActionHandler(onDelete)} className="delete-button"><TrashIcon/> Delete</button>
                </div>
            )}
        </div>
    );
};

export const HistoryPanel = ({ 
    history, 
    activeTab, 
    onSelect, 
    onRename, 
    onPin, 
    onDownload, 
    onDelete, 
    onClear, 
    onMultiply, 
    activeId, 
    isVisible, 
    onClose,
    searchQuery,
    onSearchChange
}: {
    history: { [key in TabType]: HistoryItem<any, any>[] },
    activeTab: TabType,
    onSelect: (id: string) => void,
    onRename: (id: string, newTitle: string) => void,
    onPin: (id: string) => void,
    onDownload: (item: HistoryItem<any, any>, type: 'docx' | 'pdf') => void,
    onDelete: (id: string) => void,
    onClear: () => void,
    onMultiply: (item: HistoryItem<any, any>) => void,
    activeId: string | null,
    isVisible: boolean;
    onClose: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}) => {
    const ICONS: { [key in TabType]: React.ReactNode } = { dashboard: <DashboardIcon />, plan: <PlanIcon />, youtube: <YoutubeIcon />, instagram: <ReelsIcon />, trend: <TrendIcon />, analyzer: <AnalyzerIcon />, prompt_studio: <SparklesIcon/>, knowledge_hub: <BrainCircuitIcon /> };
    const tabDisplayName: { [key in TabType]: string } = { dashboard: 'Dasbor', plan: 'Content Plan', youtube: 'Short Youtube', instagram: 'Instagram Reels', trend: 'Trend Fusion', analyzer: 'Analyzer', prompt_studio: 'Prompt Studio', knowledge_hub: 'Pusat Pengetahuan' };
    
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');

    const handleStartRename = (item: HistoryItem<any,any>) => { setEditingId(item.id); setEditingTitle(item.title); };
    
    const handleCancelRename = () => { setEditingId(null); };

    const handleFinishRename = () => { 
        if (editingId) onRename(editingId, editingTitle); 
        setEditingId(null); 
    };
    
    const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleFinishRename();
        } else if (e.key === 'Escape') {
            handleCancelRename();
        }
    };


    const displayedHistory = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (query) {
            return Object.values(history)
                .flat()
                .filter(item => item.title.toLowerCase().includes(query))
                .sort((a, b) => b.timestamp - a.timestamp);
        }
        return (history[activeTab] || [])
            .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.timestamp - a.timestamp);
    }, [searchQuery, history, activeTab]);

    const isSearching = searchQuery.trim().length > 0;

    return (
        <aside className={`history-panel ${isVisible ? 'visible' : ''}`}>
             <div className="history-panel-header">
                <div className="history-panel-header-top">
                    <h2>{isSearching ? 'Hasil Pencarian' : `${tabDisplayName[activeTab]} History`}</h2>
                    <button onClick={onClose} className="history-close-button" aria-label="Close history">
                        <CloseIcon />
                    </button>
                </div>
                 <div className="history-search-container">
                    <span className="history-search-icon"><SearchIcon /></span>
                    <input 
                        type="search"
                        placeholder="Cari di semua riwayat..."
                        className="history-search-input"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                 </div>
            </div>
            <div className="history-panel-content">
                {(activeTab !== 'analyzer' && activeTab !== 'knowledge_hub') || isSearching ? (
                     displayedHistory.length > 0 ? (
                        <>
                            <ul className="history-list">
                                {displayedHistory.map(item => (
                                    <li key={item.id} onClick={() => editingId !== item.id && onSelect(item.id)} className={`history-item ${activeId === item.id ? 'active' : ''}`}>
                                        <div className="history-item-icon">
                                            {item.pinned && <PinIcon isPinned={true} />}
                                            {ICONS[item.type]}
                                        </div>
                                        <div className="history-item-info">
                                            {editingId === item.id ? (
                                                <input 
                                                    type="text" 
                                                    value={editingTitle} 
                                                    onChange={(e) => setEditingTitle(e.target.value)} 
                                                    onBlur={handleFinishRename} 
                                                    onKeyDown={handleRenameKeyDown}
                                                    autoFocus 
                                                    className="history-item-rename-input"
                                                />
                                            ) : (
                                                <>
                                                  <span className="history-item-title">
                                                    {item.title}
                                                    {item.type === 'youtube' && item.data?.generationMethod === 'veo' && (<span className="veo-badge">Veo</span>)}
                                                    {item.type === 'instagram' && item.data?.generationMethod === 'veo' && (<span className="veo-badge">Veo</span>)}
                                                  </span>
                                                  <span className="history-item-date">{new Date(item.timestamp).toLocaleString()}</span>
                                                </>
                                            )}
                                        </div>
                                        <HistoryItemActions 
                                            item={item} 
                                            onRename={() => handleStartRename(item)} 
                                            onPin={() => onPin(item.id)} 
                                            onDownload={(type) => onDownload(item, type)}
                                            onDelete={() => onDelete(item.id)}
                                            onMultiply={() => onMultiply(item)}
                                        />
                                    </li>))}
                            </ul>
                            {!isSearching && <button onClick={onClear} className="clear-history-button">Clear {tabDisplayName[activeTab]} History</button>}
                        </>
                    ) : (
                        <p className="no-history-message">{isSearching ? 'Tidak ada hasil ditemukan.' : 'Riwayat Anda untuk tab ini akan muncul di sini.'}</p>
                    )
                ) : (
                    <p className="no-history-message">{activeTab === 'analyzer' ? 'Analyzer tidak memiliki riwayat. Ia memproses data dari Riwayat Rencana Konten Anda.' : 'Pusat Pengetahuan tidak memiliki riwayat. Kelola file Anda di tab utama.'}</p>
                )}
            </div>
        </aside>
    );
};