"use client";

import { useState, useEffect, useRef } from 'react';
import { Plus, X, Palette, GripVertical, Wand2, Copy, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button, buttonVariants } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type Line = {
  id: string;
  text: string;
  style: 'normal' | 'heading';
};

type Note = {
  id: string;
  title: string;
  lines: Line[];
};

const initialNotes: Note[] = [
  {
    id: 'note-1',
    title: 'Catatan Selamat Datang',
    lines: [
      { id: 'line-1-1', text: 'Selamat datang di SipalingNoted!', style: 'heading' },
      { id: 'line-1-2', text: 'Ini adalah aplikasi catatan berbasis tab yang membantumu tetap terorganisir.', style: 'normal' },
      { id: 'line-1-3', text: 'Klik dua kali judul tab untuk mengubahnya.', style: 'normal' },
      { id: 'line-1-4', text: 'Gunakan tombol (+) untuk menambah baris baru.', style: 'normal' },
      { id: 'line-1-5', text: 'Seret dan lepas untuk mengatur ulang urutan baris.', style: 'normal' },
    ],
  },
];

const themes = [
    { name: "Default", class: "theme-default" },
    { name: "Mawar", class: "theme-rose" },
    { name: "Hijau", class: "theme-green" },
    { name: "Jeruk", class: "theme-orange" },
    { name: "Gelap", class: "dark" },
];

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [activeTheme, setActiveTheme] = useState(themes[0].class);

  // Load from localStorage
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedNotes = localStorage.getItem('sipaling-noted-notes');
      const savedActiveTabId = localStorage.getItem('sipaling-noted-activeTabId');
      const savedTheme = localStorage.getItem('sipaling-noted-theme');

      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      } else {
        setNotes(initialNotes);
      }

      if (savedActiveTabId) {
        setActiveTabId(savedActiveTabId);
      } else if (initialNotes.length > 0) {
        setActiveTabId(initialNotes[0].id);
      }
      
      if (savedTheme) {
        setActiveTheme(savedTheme);
      }

    } catch (error) {
      console.error("Failed to load from localStorage", error);
      setNotes(initialNotes);
      if (initialNotes.length > 0) {
        setActiveTabId(initialNotes[0].id);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('sipaling-noted-notes', JSON.stringify(notes));
      if (activeTabId) {
        localStorage.setItem('sipaling-noted-activeTabId', activeTabId);
      }
      localStorage.setItem('sipaling-noted-theme', activeTheme);
    }
  }, [notes, activeTabId, isMounted, activeTheme]);
  
  // Apply theme class to body
  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(activeTheme);
  }, [activeTheme]);

  // Handle editing tab title
  useEffect(() => {
    if (editingTabId && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTabId]);

  const autoResizeTextarea = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  };

  const handleTextChange = (noteId: string, lineId: string, newText: string) => {
    setNotes(notes.map(note =>
      note.id === noteId
        ? {
          ...note,
          lines: note.lines.map(line =>
            line.id === lineId ? { ...line, text: newText } : line
          ),
        }
        : note
    ));
  };

  const addNewLine = (noteId: string, afterLineId?: string) => {
    const newLine: Line = { id: `line-${Date.now()}`, text: '', style: 'normal' };
    setNotes(notes.map(note => {
      if (note.id === noteId) {
        const newLines = [...note.lines];
        const index = afterLineId ? newLines.findIndex(l => l.id === afterLineId) + 1 : newLines.length;
        newLines.splice(index, 0, newLine);
        return { ...note, lines: newLines };
      }
      return note;
    }));
    setTimeout(() => {
      const newTextarea = document.querySelector(`[data-line-id="${newLine.id}"] textarea`) as HTMLTextAreaElement;
      newTextarea?.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, noteId: string, lineId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addNewLine(noteId, lineId);
    } else if (e.key === 'Backspace' && e.currentTarget.value === '') {
        const activeNote = notes.find(n => n.id === activeTabId);
        if (activeNote && activeNote.lines.length > 1) {
            e.preventDefault();
            removeLine(noteId, lineId);
        }
    }
  };

  const removeLine = (noteId: string, lineId: string) => {
    let focusPrevious = false;
    setNotes(notes.map(note => {
      if (note.id === noteId) {
        const lineIndex = note.lines.findIndex(l => l.id === lineId);
        if (lineIndex > 0) focusPrevious = true;
        const newLines = note.lines.filter(line => line.id !== lineId);
        if (newLines.length === 0) {
            newLines.push({ id: `line-${Date.now()}`, text: '', style: 'normal' });
        }
        if (focusPrevious) {
            setTimeout(() => {
                const prevLine = note.lines[lineIndex - 1];
                const prevTextarea = document.querySelector(`[data-line-id="${prevLine.id}"] textarea`) as HTMLTextAreaElement;
                prevTextarea?.focus();
            }, 0);
        }
        return { ...note, lines: newLines };
      }
      return note;
    }));
  };

  const addNewTab = () => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: 'Tanpa Judul',
      lines: [{ id: `line-${Date.now()}-1`, text: '', style: 'normal' }],
    };
    setNotes([...notes, newNote]);
    setActiveTabId(newNote.id);
  };

  const removeTab = (noteIdToRemove: string) => {
    const noteIndex = notes.findIndex(note => note.id === noteIdToRemove);
    const newNotes = notes.filter(note => note.id !== noteIdToRemove);

    if (newNotes.length === 0) {
        const newNote: Note = {
            id: `note-${Date.now()}`,
            title: 'Tanpa Judul',
            lines: [{ id: `line-${Date.now()}-1`, text: '', style: 'normal' }],
        };
        setNotes([newNote]);
        setActiveTabId(newNote.id);
    } else if (activeTabId === noteIdToRemove) {
      const newActiveIndex = Math.max(0, noteIndex - 1);
      setActiveTabId(newNotes[newActiveIndex].id);
      setNotes(newNotes);
    } else {
      setNotes(newNotes);
    }
  };

  const handleTitleChange = (noteId: string, newTitle: string) => {
    setNotes(notes.map(note =>
      note.id === noteId ? { ...note, title: newTitle } : note
    ));
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      setEditingTabId(null);
    }
  };

  const handleDragSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const activeNote = notes.find(n => n.id === activeTabId);
    if (!activeNote) return;

    const newLines = [...activeNote.lines];
    const draggedItemContent = newLines.splice(dragItem.current, 1)[0];
    newLines.splice(dragOverItem.current, 0, draggedItemContent);
    
    dragItem.current = null;
    dragOverItem.current = null;

    setNotes(notes.map(n => n.id === activeTabId ? { ...n, lines: newLines } : n));
  };

  const handleStyleLine = (noteId: string, lineId: string) => {
     setNotes(notes.map(note => {
      if (note.id === noteId) {
        return {
          ...note,
          lines: note.lines.map(line => {
            if (line.id === lineId) {
              return { ...line, style: line.style === 'heading' ? 'normal' : 'heading' };
            }
            return line;
          })
        };
      }
      return note;
    }));
  };
  
  const handleCopyLine = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
        toast({ title: "Tersalin!", description: "Baris telah disalin ke papan klip." });
    });
  };

  const activeNote = notes.find(note => note.id === activeTabId);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-body">
      {/* Header */}
      <header className="flex items-center justify-between p-2 border-b border-border">
        <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-headline text-primary">SipalingNoted</h1>
            <a href="https://faaadelmr.pages.dev" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                by faaadelmr
            </a>
        </div>
        <div className="flex items-center gap-2">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Palette className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {themes.map((theme) => (
                <DropdownMenuItem key={theme.name} onClick={() => setActiveTheme(theme.class)}>
                  {theme.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-col flex-grow min-h-0">
        <Tabs value={activeTabId} onValueChange={setActiveTabId} className="flex flex-col flex-grow">
          {/* Tab List */}
          <div className="flex-shrink-0 p-2 border-b border-border">
             <ScrollArea className="w-full">
              <TabsList className="p-0 bg-transparent">
                <div className="flex items-center gap-1">
                {notes.map(note => (
                  <TabsTrigger
                    key={note.id}
                    value={note.id}
                    className={cn(
                      "relative flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-transparent",
                      activeTabId === note.id ? "bg-primary/10 border-primary text-primary" : "text-muted-foreground hover:bg-muted"
                    )}
                    onDoubleClick={() => setEditingTabId(note.id)}
                  >
                    {editingTabId === note.id ? (
                      <input
                        ref={titleInputRef}
                        type="text"
                        value={note.title}
                        onChange={(e) => handleTitleChange(note.id, e.target.value)}
                        onBlur={() => setEditingTabId(null)}
                        onKeyDown={handleTitleKeyDown}
                        className="bg-transparent focus:outline-none"
                      />
                    ) : (
                      <span>{note.title}</span>
                    )}
                     <div
                      role="button"
                      aria-label="Remove tab"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTab(note.id);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'icon' }),
                        'w-5 h-5 ml-2 rounded-full hover:bg-destructive/20 hover:text-destructive'
                      )}
                    >
                      <X className="w-3 h-3" />
                    </div>
                  </TabsTrigger>
                ))}
                 <Button variant="ghost" size="icon" onClick={addNewTab} className="w-8 h-8 rounded-full">
                  <Plus className="w-4 h-4" />
                </Button>
                </div>
              </TabsList>
            </ScrollArea>
          </div>
          
          {/* Content Area */}
          <ScrollArea className="flex-grow">
            <div className="p-4 md:p-6">
            {notes.map(note => (
              <TabsContent key={note.id} value={note.id} className="mt-0">
                {note.lines.map((line, index) => (
                  <div
                    key={line.id}
                    data-line-id={line.id}
                    className="flex items-start w-full gap-2 group"
                    draggable
                    onDragStart={() => dragItem.current = index}
                    onDragEnter={() => dragOverItem.current = index}
                    onDragEnd={handleDragSort}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div className="flex items-center h-10">
                        <button className="cursor-grab opacity-30 hover:opacity-100 transition-opacity">
                            <GripVertical className="w-4 h-4" />
                        </button>
                    </div>
                    <Textarea
                      value={line.text}
                      onChange={(e) => {
                        handleTextChange(note.id, line.id, e.target.value);
                        autoResizeTextarea(e.currentTarget);
                      }}
                      onKeyDown={(e) => handleKeyDown(e, note.id, line.id)}
                      onFocus={(e) => autoResizeTextarea(e.currentTarget)}
                      ref={(el) => {
                        if (el) {
                            // Run on next frame to ensure rendering is complete
                            setTimeout(() => autoResizeTextarea(el), 0);
                        }
                      }}
                      className={cn(
                        "flex-grow my-1 py-2 leading-7 resize-none",
                        line.style === 'heading' ? 'text-2xl font-bold' : 'text-base'
                      )}
                      placeholder="Ketik sesuatu..."
                    />
                     <div className="flex items-center h-10 gap-1 transition-opacity">
                       <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => handleStyleLine(note.id, line.id)}>
                           <Wand2 className="w-4 h-4" />
                       </Button>
                       <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => handleCopyLine(line.text)}>
                            <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive/50 hover:text-destructive" onClick={() => removeLine(note.id, line.id)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                  </div>
                ))}
                <div className="pl-12">
                   <Button variant="ghost" onClick={() => addNewLine(note.id)} className="mt-2 text-muted-foreground">
                        <Plus className="w-4 h-4 mr-2" /> Tambah Baris
                    </Button>
                </div>
              </TabsContent>
            ))}
            </div>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}
