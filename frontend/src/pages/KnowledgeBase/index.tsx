import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ingestFiles, ingestURLs, getIngestHistory } from '../../api/ingest';
import type { IngestionRecord } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Globe, X, CheckCircle2, FileText, Plus, Loader2, Trash2, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import './KnowledgeBase.css';



export default function KnowledgeBase() {
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>(['']);
  const queryClient = useQueryClient();

  const {
    data: history = [],
    isLoading: historyLoading,
    isError: historyError,
    refetch: refetchHistory,
    isFetching: historyFetching,
  } = useQuery<IngestionRecord[]>({
    queryKey: ['ingest-history'],
    queryFn: getIngestHistory,
    refetchInterval: 10_000, // auto-poll every 10s
  });

  const onDrop = useCallback((accepted: File[]) => {
    setFiles(prev => [...prev, ...accepted]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    multiple: true,
  });

  const fileMutation = useMutation({
    mutationFn: () => ingestFiles(files),
    onSuccess: (data) => {
      toast.success(data.message);
      setFiles([]);
      queryClient.invalidateQueries({ queryKey: ['ingest-history'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const urlMutation = useMutation({
    mutationFn: () => ingestURLs({ urls: urls.filter(Boolean) }),
    onSuccess: (data) => {
      toast.success(data.message);
      setUrls(['']);
      queryClient.invalidateQueries({ queryKey: ['ingest-history'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addUrl = () => setUrls(prev => [...prev, '']);
  const updateUrl = (i: number, val: string) => setUrls(prev => prev.map((u, idx) => idx === i ? val : u));
  const removeUrl = (i: number) => setUrls(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : ['']);
  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const validUrls = urls.filter(u => u.trim().length > 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Knowledge Base</h1>
        <p className="page-subtitle">Upload documents and web pages to power the AI agent's responses.</p>
      </div>

      <div className="grid-2" style={{ marginBottom: 'var(--space-6)' }}>
        {/* File Upload */}
        <div className="card">
          <div className="card-header"><Upload size={16} /> Upload Documents</div>
          <div className="card-body stack">
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
              <input {...getInputProps()} />
              <Upload size={28} color="var(--color-text-tertiary)" />
              <div className="dropzone-text">
                {isDragActive ? 'Drop files here…' : 'Drag & drop files here'}
                <span>or click to browse</span>
              </div>
              <div className="row" style={{ justifyContent: 'center', gap: 'var(--space-2)' }}>
                <span className="badge badge-neutral">PDF</span>
                <span className="badge badge-neutral">TXT</span>
              </div>
            </div>

            <AnimatePresence>
              {files.map((f, i) => (
                <motion.div key={f.name + i} className="file-row" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <FileText size={16} color="var(--color-accent)" />
                  <span className="file-name">{f.name}</span>
                  <span className="file-size">{(f.size / 1024).toFixed(0)} KB</span>
                  <button className="btn btn-icon btn-outline" onClick={() => removeFile(i)}>
                    <Trash2 size={13} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            <button
              className="btn btn-primary"
              disabled={files.length === 0 || fileMutation.isPending}
              onClick={() => fileMutation.mutate()}
            >
              {fileMutation.isPending ? <><Loader2 size={14} className="spin-icon" /> Ingesting…</> : <><Upload size={14} /> Upload & Ingest</>}
            </button>
          </div>
        </div>

        {/* URL Ingest */}
        <div className="card">
          <div className="card-header"><Globe size={16} /> Add Web Pages</div>
          <div className="card-body stack">
            <div className="stack" style={{ gap: 'var(--space-3)' }}>
              {urls.map((url, i) => (
                <div key={i} className="url-row">
                  <Globe size={14} color="var(--color-text-tertiary)" style={{ flexShrink: 0 }} />
                  <input
                    className="form-input"
                    type="url"
                    placeholder="https://your-docs.com/page"
                    value={url}
                    onChange={e => updateUrl(i, e.target.value)}
                    style={{ border: 'none', padding: '0', boxShadow: 'none', borderBottom: '1px solid var(--color-border)', borderRadius: 0 }}
                  />
                  <button className="btn btn-icon btn-outline" onClick={() => removeUrl(i)}>
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>

            <button className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }} onClick={addUrl}>
              <Plus size={13} /> Add URL
            </button>

            <button
              className="btn btn-primary"
              disabled={validUrls.length === 0 || urlMutation.isPending}
              onClick={() => urlMutation.mutate()}
            >
              {urlMutation.isPending ? <><Loader2 size={14} className="spin-icon" /> Ingesting…</> : <><Globe size={14} /> Ingest URLs</>}
            </button>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Ingestion History</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {history.length > 0 && (
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                {history.length} record{history.length !== 1 ? 's' : ''}
              </span>
            )}
            <button
              className="btn btn-outline btn-sm"
              onClick={() => refetchHistory()}
              disabled={historyFetching}
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <RefreshCw size={13} style={{ animation: historyFetching ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        </div>

        {historyError && (
          <div style={{ padding: 'var(--space-4)', color: 'var(--color-critical)', fontSize: 'var(--font-size-sm)' }}>
            ⚠️ Failed to load history. Make sure the backend is running.
          </div>
        )}

        {historyLoading ? (
          <div style={{ padding: 'var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', color: 'var(--color-text-tertiary)' }}>
            <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 'var(--font-size-sm)' }}>Loading history…</span>
          </div>
        ) : history.length === 0 && !historyError ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
            No ingestion records yet. Upload a document or add a URL to get started.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Type</th>
                <th>Chunks Stored</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {history.map(rec => (
                <tr key={rec.id}>
                  <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-accent)' }}>{rec.source}</td>
                  <td><span className="badge badge-neutral">{rec.type === 'file' ? 'PDF/TXT' : 'URL'}</span></td>
                  <td style={{ fontWeight: 600 }}>{rec.chunks_stored || '—'}</td>
                  <td>
                    {rec.status === 'success' ? (
                      <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-size-sm)' }}>
                        <CheckCircle2 size={13} /> Success
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-warning)', fontSize: 'var(--font-size-sm)' }}>Processing…</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>{rec.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
