import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Link2, Search, X, Loader2, FileUp, Upload } from 'lucide-react';
import { CyberButton } from '../components/ui/CyberButton';
import { CyberInput } from '../components/ui/CyberInput';
import { CyberCard } from '../components/ui/CyberCard';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { MemoryCard } from '../components/features/MemoryCard';
import { useMemoryStore } from '../stores/memoryStore';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { memoryApi } from '../lib/api';

const MemoryBank: React.FC = () => {
  const navigate = useNavigate();
  const { id: workspaceId } = useParams<{ id: string }>();
  const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId);
  
  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    getFilteredMemories,
    deleteMemory,
    loadMemories,
  } = useMemoryStore();

  const currentWorkspaceId = workspaceId || activeWorkspaceId || 'workspace-1';
  const memories = getFilteredMemories(currentWorkspaceId);

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMode, setImportMode] = useState<'url' | 'file'>('url');
  const [importUrl, setImportUrl] = useState('');
  const [shouldSummarize, setShouldSummarize] = useState(true);
  const [scrapeMode, setScrapeMode] = useState<'basic' | 'advanced'>('basic');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  
  // File import state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileSummarize, setFileSummarize] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Delete confirmation state
  const [deleteMemoryId, setDeleteMemoryId] = useState<string | null>(null);

  const handleView = (memoryId: string) => {
    navigate(`/app/memories/${memoryId}`);
  };

  const handleEdit = (memoryId: string) => {
    // For now, navigate to detail page (edit functionality will be in detail page)
    navigate(`/app/memories/${memoryId}`);
  };

  const handleDelete = (memoryId: string) => {
    setDeleteMemoryId(memoryId);
  };

  const confirmDelete = () => {
    if (deleteMemoryId) {
      deleteMemory(deleteMemoryId);
      setDeleteMemoryId(null);
    }
  };

  const handleImportFromUrl = async () => {
    if (!importUrl.trim()) return;
    
    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);
    
    try {
      const result = await memoryApi.importFromUrl(currentWorkspaceId, importUrl.trim(), shouldSummarize, scrapeMode);
      
      // Refresh memories list
      await loadMemories(currentWorkspaceId);
      
      setImportSuccess(`Successfully imported "${result.memory.title}" from ${result.source_type}`);
      setImportUrl('');
      
      // Close modal after a delay
      setTimeout(() => {
        setShowImportModal(false);
        setImportSuccess(null);
      }, 2000);
    } catch (error: any) {
      setImportError(error.message || 'Failed to import from URL');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportFromFile = async () => {
    if (!selectedFile) return;
    
    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);
    
    try {
      const result = await memoryApi.importFromFile(currentWorkspaceId, selectedFile, fileSummarize);
      
      // Refresh memories list
      await loadMemories(currentWorkspaceId);
      
      setImportSuccess(`Successfully imported "${result.original_filename}" as memory`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Close modal after a delay
      setTimeout(() => {
        setShowImportModal(false);
        setImportSuccess(null);
      }, 2000);
    } catch (error: any) {
      setImportError(error.message || 'Failed to import file');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportError(null);
    }
  };

  const resetImportModal = () => {
    setShowImportModal(false);
    setImportUrl('');
    setSelectedFile(null);
    setImportError(null);
    setImportSuccess(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteMemoryId}
        onClose={() => setDeleteMemoryId(null)}
        onConfirm={confirmDelete}
        title="Delete Memory"
        message="Are you sure you want to delete this memory? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />

      <div className="min-h-screen bg-black text-white p-8">
        {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-cyber text-neon-green mb-2">
              Memory Bank
            </h1>
            <p className="text-gray-400 text-sm">
              Semantic knowledge repository for cognitive model injection
            </p>
          </div>
          <div className="flex gap-3">
            <CyberButton
              variant="secondary"
              onClick={() => { setImportMode('url'); setShowImportModal(true); }}
            >
              <Link2 size={18} className="mr-2" />
              Import URL
            </CyberButton>
            <CyberButton
              variant="primary"
              glow
              onClick={() => { setImportMode('file'); setShowImportModal(true); }}
            >
              <FileUp size={18} className="mr-2" />
              Import File
            </CyberButton>
          </div>
        </div>

        {/* Search and Sort Controls */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <div className="relative">
              <Search 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neon-green" 
                size={18} 
              />
              <CyberInput
                type="search"
                placeholder="Search memories by title, content, or tags..."
                value={searchQuery}
                onChange={setSearchQuery}
                className="pl-12"
              />
            </div>
          </div>
          
          <div className="w-64">
            <label className="block text-gray-400 text-xs mb-2 uppercase tracking-wider">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'title' | 'relevance')}
              className="w-full px-4 py-3 bg-black border-2 border-deep-teal 
                         text-neon-green font-mono text-sm
                         focus:border-neon-green focus:shadow-neon focus:outline-none
                         transition-all duration-300 angular-frame cursor-pointer"
            >
              <option value="recent">Most Recent</option>
              <option value="title">Title (A-Z)</option>
              <option value="relevance">Relevance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Memory Grid */}
      {memories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="inline-block p-8 border-2 border-deep-teal angular-frame">
            <p className="text-gray-400 text-lg mb-4">
              {searchQuery 
                ? 'No memories found matching your search.' 
                : 'No memories in this workspace yet.'}
            </p>
            {!searchQuery ? (
              <p className="text-gray-500 text-sm">
                Memories are automatically generated from your conversations.
                <br />
                Start a chat to create your first memory.
              </p>
            ) : (
              <CyberButton
                variant="secondary"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </CyberButton>
            )}
          </div>
        </div>
      )}

      {/* Memory Count */}
      <div className="mt-8 text-center">
        <p className="text-gray-500 text-sm font-mono">
          Displaying {memories.length} {memories.length === 1 ? 'memory' : 'memories'}
          {searchQuery && ' (filtered)'}
        </p>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg">
            <CyberCard 
              title={importMode === 'url' ? 'Import from URL' : 'Import from File'} 
              glowBorder 
              cornerAccents
            >
              <div className="space-y-4">
                {importSuccess ? (
                  <div className="text-center py-4">
                    <div className="text-neon-green text-lg mb-2">✓ Import Successful!</div>
                    <p className="text-gray-400 text-sm">{importSuccess}</p>
                  </div>
                ) : (
                  <>
                    {/* Mode Tabs */}
                    <div className="flex border-b border-deep-teal">
                      <button
                        onClick={() => setImportMode('url')}
                        className={`flex-1 py-2 text-sm font-mono transition-colors ${
                          importMode === 'url' 
                            ? 'text-neon-green border-b-2 border-neon-green' 
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        <Link2 size={16} className="inline mr-2" />
                        URL
                      </button>
                      <button
                        onClick={() => setImportMode('file')}
                        className={`flex-1 py-2 text-sm font-mono transition-colors ${
                          importMode === 'file' 
                            ? 'text-neon-green border-b-2 border-neon-green' 
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        <FileUp size={16} className="inline mr-2" />
                        File
                      </button>
                    </div>

                    {importMode === 'url' ? (
                      <>
                        <p className="text-gray-400 text-sm">
                          Import content from public URLs like ChatGPT conversations, Google Docs, Notion pages, and more.
                        </p>

                        <div>
                          <label className="block text-gray-400 text-xs mb-2 uppercase tracking-wider">
                            URL
                          </label>
                          <input
                            type="url"
                            value={importUrl}
                            onChange={(e) => {
                              setImportUrl(e.target.value);
                              setImportError(null);
                            }}
                            placeholder="https://chat.openai.com/share/..."
                            className="w-full px-4 py-3 bg-black border-2 border-deep-teal 
                                       text-neon-green font-mono text-sm
                                       focus:border-neon-green focus:shadow-neon focus:outline-none
                                       transition-all duration-300 angular-frame"
                            disabled={isImporting}
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="summarize-url"
                            checked={shouldSummarize}
                            onChange={(e) => setShouldSummarize(e.target.checked)}
                            className="w-4 h-4 accent-neon-green"
                            disabled={isImporting}
                          />
                          <label htmlFor="summarize-url" className="text-gray-400 text-sm">
                            Summarize content (recommended for long pages)
                          </label>
                        </div>

                        {/* Scrape Mode Selector */}
                        <div>
                          <label className="block text-gray-400 text-xs mb-2 uppercase tracking-wider">
                            Scrape Mode
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setScrapeMode('basic')}
                              disabled={isImporting}
                              className={`flex-1 py-2 px-3 text-xs font-mono border-2 transition-all duration-300 angular-frame ${
                                scrapeMode === 'basic'
                                  ? 'border-neon-green bg-neon-green/10 text-neon-green'
                                  : 'border-deep-teal text-gray-400 hover:border-gray-500'
                              }`}
                            >
                              Basic
                              <span className="block text-[10px] mt-0.5 opacity-70">Fast & Lightweight</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setScrapeMode('advanced')}
                              disabled={isImporting}
                              className={`flex-1 py-2 px-3 text-xs font-mono border-2 transition-all duration-300 angular-frame ${
                                scrapeMode === 'advanced'
                                  ? 'border-neon-green bg-neon-green/10 text-neon-green'
                                  : 'border-deep-teal text-gray-400 hover:border-gray-500'
                              }`}
                            >
                              Advanced
                              <span className="block text-[10px] mt-0.5 opacity-70">JS-heavy sites</span>
                            </button>
                          </div>
                          <p className="text-[10px] text-gray-600 mt-1">
                            {scrapeMode === 'basic' 
                              ? 'Uses requests + BeautifulSoup. Works for most static sites.'
                              : 'Uses Playwright browser. Required for JS-rendered content. Needs premium server.'}
                          </p>
                        </div>

                        <div className="text-xs text-gray-500 space-y-1">
                          <p className="font-bold text-gray-400">Supported sources:</p>
                          <ul className="list-disc list-inside space-y-0.5 text-xs">
                            <li>ChatGPT, Claude, Gemini, DeepSeek conversations</li>
                            <li>Google Docs, Notion pages (public)</li>
                            <li>GitHub, Medium, any public webpage</li>
                          </ul>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-400 text-sm">
                          Upload documents to extract and store their content as memories.
                        </p>

                        <div>
                          <label className="block text-gray-400 text-xs mb-2 uppercase tracking-wider">
                            Select File
                          </label>
                          <div 
                            className={`
                              border-2 border-dashed rounded p-6 text-center cursor-pointer
                              transition-all duration-300
                              ${selectedFile 
                                ? 'border-neon-green bg-neon-green/5' 
                                : 'border-deep-teal hover:border-neon-green/50'
                              }
                            `}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              onChange={handleFileSelect}
                              accept=".pdf,.docx,.txt,.md,.html,.htm,.json,.csv"
                              className="hidden"
                              disabled={isImporting}
                            />
                            {selectedFile ? (
                              <div>
                                <FileUp size={32} className="mx-auto mb-2 text-neon-green" />
                                <p className="text-neon-green font-mono text-sm">{selectedFile.name}</p>
                                <p className="text-gray-500 text-xs mt-1">
                                  {(selectedFile.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            ) : (
                              <div>
                                <Upload size={32} className="mx-auto mb-2 text-gray-500" />
                                <p className="text-gray-400 text-sm">Click to select a file</p>
                                <p className="text-gray-600 text-xs mt-1">or drag and drop</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="summarize-file"
                            checked={fileSummarize}
                            onChange={(e) => setFileSummarize(e.target.checked)}
                            className="w-4 h-4 accent-neon-green"
                            disabled={isImporting}
                          />
                          <label htmlFor="summarize-file" className="text-gray-400 text-sm">
                            Summarize content (for large documents)
                          </label>
                        </div>

                        <div className="text-xs text-gray-500 space-y-1">
                          <p className="font-bold text-gray-400">Supported formats:</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {['.pdf', '.docx', '.txt', '.md', '.html', '.json', '.csv'].map(ext => (
                              <span key={ext} className="px-2 py-1 bg-deep-teal/30 rounded text-neon-green/70">
                                {ext}
                              </span>
                            ))}
                          </div>
                          <p className="mt-2 text-gray-600">Max file size: 10MB</p>
                        </div>
                      </>
                    )}

                    {importError && (
                      <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded p-3">
                        {importError}
                      </div>
                    )}

                    <div className="flex gap-4 mt-6">
                      <CyberButton
                        variant="primary"
                        glow
                        onClick={importMode === 'url' ? handleImportFromUrl : handleImportFromFile}
                        disabled={importMode === 'url' ? !importUrl.trim() || isImporting : !selectedFile || isImporting}
                        className="flex-1"
                      >
                        {isImporting ? (
                          <>
                            <Loader2 size={18} className="mr-2 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            {importMode === 'url' ? <Link2 size={18} className="mr-2" /> : <Upload size={18} className="mr-2" />}
                            Import
                          </>
                        )}
                      </CyberButton>
                      <CyberButton
                        variant="secondary"
                        onClick={resetImportModal}
                        disabled={isImporting}
                        className="flex-1"
                      >
                        <X size={18} className="mr-2" />
                        Cancel
                      </CyberButton>
                    </div>
                  </>
                )}
              </div>
            </CyberCard>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default MemoryBank;
