import React, { useRef, useState, useEffect } from 'react';
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Code, Strikethrough, Image, Video, Youtube,
  ExternalLink, Loader2,
} from 'lucide-react';
import { lessonApi } from '../services/api';

interface RichTextEditorProps {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
  label?: string;
}

const extractYoutubeId = (url: string): string | null => {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&?/\s]{11})/
  );
  return m ? m[1] : null;
};

export function RichTextEditor({ value, onChange, placeholder = 'Type here...', minHeight = 150, label }: RichTextEditorProps) {
  const editorRef      = useRef<HTMLDivElement>(null);
  const imageInputRef  = useRef<HTMLInputElement>(null);
  const videoInputRef  = useRef<HTMLInputElement>(null);
  const savedRangeRef  = useRef<Range | null>(null);

  const [linkUrl,     setLinkUrl]     = useState('');
  const [showLink,    setShowLink]    = useState(false);
  const [youtubeUrl,  setYoutubeUrl]  = useState('');
  const [showYoutube, setShowYoutube] = useState(false);
  const [uploading,   setUploading]   = useState(false);

  // Seed initial content once on mount — never re-sync from props to avoid the single-char reset bug
  useEffect(() => {
    if (editorRef.current && value) {
      editorRef.current.innerHTML = value;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (command: string, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    if (onChange && editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleInput = () => {
    if (onChange && editorRef.current) onChange(editorRef.current.innerHTML);
  };

  // Save the current caret/selection before a toolbar popover steals focus
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  // Restore the saved caret and inject arbitrary HTML at that position
  const insertHtmlAtCursor = (html: string) => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (savedRangeRef.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
    document.execCommand('insertHTML', false, html);
    if (onChange && editorRef.current) onChange(editorRef.current.innerHTML);
  };

  // ── External link ─────────────────────────────────────────────────────────
  const insertLink = () => {
    if (!linkUrl) return;
    const sel  = window.getSelection();
    const text = sel && sel.toString().trim() ? sel.toString() : linkUrl;
    insertHtmlAtCursor(
      `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`
    );
    setLinkUrl('');
    setShowLink(false);
  };

  // ── Image from machine ────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await lessonApi.uploadMedia(file);
      const url: string = res.data?.data?.url ?? '';
      if (url) {
        insertHtmlAtCursor(
          `<img src="${url}" alt="${file.name}" style="max-width:100%;height:auto;border-radius:6px;margin:8px 0;display:block;" />`
        );
      }
    } catch {
      alert('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  // ── Video from machine ────────────────────────────────────────────────────
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await lessonApi.uploadMedia(file);
      const url: string = res.data?.data?.url ?? '';
      if (url) {
        insertHtmlAtCursor(
          `<video controls style="max-width:100%;border-radius:8px;margin:8px 0;display:block;">` +
          `<source src="${url}" type="${file.type}" />` +
          `Your browser does not support the video tag.</video>`
        );
      }
    } catch {
      alert('Video upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  // ── YouTube embed ─────────────────────────────────────────────────────────
  const insertYoutube = () => {
    const id = extractYoutubeId(youtubeUrl);
    if (!id) { alert('Invalid YouTube URL. Please enter a valid YouTube link.'); return; }
    insertHtmlAtCursor(
      `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin:12px 0;">` +
      `<iframe src="https://www.youtube-nocookie.com/embed/${id}" ` +
      `style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" ` +
      `allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" ` +
      `allowfullscreen></iframe></div>`
    );
    setYoutubeUrl('');
    setShowYoutube(false);
  };

  const toolbarGroups = [
    [
      { icon: Bold,          cmd: 'bold',                title: 'Bold' },
      { icon: Italic,        cmd: 'italic',              title: 'Italic' },
      { icon: Underline,     cmd: 'underline',           title: 'Underline' },
      { icon: Strikethrough, cmd: 'strikeThrough',       title: 'Strikethrough' },
    ],
    [
      { icon: AlignLeft,   cmd: 'justifyLeft',   title: 'Align Left' },
      { icon: AlignCenter, cmd: 'justifyCenter', title: 'Align Center' },
      { icon: AlignRight,  cmd: 'justifyRight',  title: 'Align Right' },
    ],
    [
      { icon: List,        cmd: 'insertUnorderedList', title: 'Bullet List' },
      { icon: ListOrdered, cmd: 'insertOrderedList',   title: 'Numbered List' },
    ],
    [
      { icon: Code, cmd: 'formatBlock', title: 'Code Block' },
    ],
  ];

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
      {label && <p className="text-sm font-medium text-gray-700 px-3 pt-2">{label}</p>}

      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-matroska" className="hidden" onChange={handleVideoUpload} />

      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 px-2 py-1.5 flex items-center gap-1 flex-wrap">
        {/* Font size */}
        <select
          onChange={e => exec('fontSize', e.target.value)}
          className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-700 focus:outline-none"
          defaultValue="3"
        >
          <option value="1">Small</option>
          <option value="3">Normal</option>
          <option value="5">Large</option>
          <option value="7">Huge</option>
        </select>

        {/* Text-formatting groups */}
        {toolbarGroups.map((group, gi) => (
          <React.Fragment key={gi}>
            <span className="w-px h-4 bg-gray-300 mx-1" />
            {group.map(({ icon: Icon, cmd, title }) => (
              <button
                key={cmd}
                type="button"
                title={title}
                onMouseDown={e => { e.preventDefault(); exec(cmd); }}
                className="p-1 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </React.Fragment>
        ))}

        {/* ── Media group ── */}
        <span className="w-px h-4 bg-gray-300 mx-1" />

        {/* External link */}
        <div className="relative">
          <button
            type="button"
            title="Insert External Link (opens in new tab)"
            onClick={() => { saveSelection(); setShowLink(v => !v); setShowYoutube(false); }}
            className="p-1 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          {showLink && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-20 flex gap-1 min-w-56">
              <input
                autoFocus
                type="url"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                onKeyDown={e => e.key === 'Enter' && insertLink()}
              />
              <button onClick={insertLink} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 whitespace-nowrap">Add</button>
            </div>
          )}
        </div>

        {/* Image upload */}
        <button
          type="button"
          title={uploading ? 'Uploading…' : 'Insert Image from Computer'}
          disabled={uploading}
          onClick={() => { saveSelection(); imageInputRef.current?.click(); }}
          className="p-1 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
        </button>

        {/* Video upload */}
        <button
          type="button"
          title={uploading ? 'Uploading…' : 'Insert Video from Computer'}
          disabled={uploading}
          onClick={() => { saveSelection(); videoInputRef.current?.click(); }}
          className="p-1 rounded hover:bg-gray-200 text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
        >
          <Video className="w-4 h-4" />
        </button>

        {/* YouTube embed */}
        <div className="relative">
          <button
            type="button"
            title="Embed YouTube Video"
            onClick={() => { saveSelection(); setShowYoutube(v => !v); setShowLink(false); }}
            className="p-1 rounded hover:bg-gray-200 text-red-500 hover:text-red-700 transition-colors"
          >
            <Youtube className="w-4 h-4" />
          </button>
          {showYoutube && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-20 flex gap-1 min-w-72">
              <input
                autoFocus
                type="url"
                value={youtubeUrl}
                onChange={e => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-red-400"
                onKeyDown={e => e.key === 'Enter' && insertYoutube()}
              />
              <button onClick={insertYoutube} className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 whitespace-nowrap">Embed</button>
            </div>
          )}
        </div>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className="p-3 text-sm text-gray-800 focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
      />
    </div>
  );
}
