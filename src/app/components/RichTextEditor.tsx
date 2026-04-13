import React, { useRef, useState } from 'react';
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link, Image, Code, Strikethrough, Type
} from 'lucide-react';

interface RichTextEditorProps {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
  label?: string;
}

export function RichTextEditor({ value, onChange, placeholder = 'Type here...', minHeight = 150, label }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLink, setShowLink] = useState(false);

  const exec = (command: string, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    if (linkUrl) {
      exec('createLink', linkUrl);
      setLinkUrl('');
      setShowLink(false);
    }
  };

  const toolbarGroups = [
    [
      { icon: Bold, cmd: 'bold', title: 'Bold' },
      { icon: Italic, cmd: 'italic', title: 'Italic' },
      { icon: Underline, cmd: 'underline', title: 'Underline' },
      { icon: Strikethrough, cmd: 'strikethrough', title: 'Strikethrough' },
    ],
    [
      { icon: AlignLeft, cmd: 'justifyLeft', title: 'Align Left' },
      { icon: AlignCenter, cmd: 'justifyCenter', title: 'Align Center' },
      { icon: AlignRight, cmd: 'justifyRight', title: 'Align Right' },
    ],
    [
      { icon: List, cmd: 'insertUnorderedList', title: 'Bullet List' },
      { icon: ListOrdered, cmd: 'insertOrderedList', title: 'Numbered List' },
    ],
    [
      { icon: Code, cmd: 'formatBlock', title: 'Code Block' },
    ],
  ];

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
      {label && <p className="text-sm font-medium text-gray-700 px-3 pt-2">{label}</p>}
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 px-2 py-1.5 flex items-center gap-1 flex-wrap">
        {/* Font size select */}
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

        <span className="w-px h-4 bg-gray-300 mx-1" />
        <div className="relative">
          <button
            type="button"
            title="Insert Link"
            onClick={() => setShowLink(!showLink)}
            className="p-1 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Link className="w-4 h-4" />
          </button>
          {showLink && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 flex gap-1 min-w-48">
              <input
                type="url"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                onKeyDown={e => e.key === 'Enter' && insertLink()}
              />
              <button onClick={insertLink} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700">Add</button>
            </div>
          )}
        </div>
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className="p-3 text-sm text-gray-800 focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
        dangerouslySetInnerHTML={value ? { __html: value } : undefined}
      />
    </div>
  );
}
