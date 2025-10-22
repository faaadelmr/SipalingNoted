"use client";

import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Copy, NotebookText, Palette, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Line = {
  id: string;
  text: string;
  style: 'normal' | 'heading';
};

type Tab = {
  id: string;
  title: string;
  content: Line[];
};

const defaultTabs: Tab[] = [
  { 
    id: '1', 
    title: 'Catatan Pertamaku', 
    content: [
      { id: Date.now() + '1', text: 'Selamat Datang di SipalingNoted!', style: 'heading'},
      { id: Date.now() + '2', text: '- Ini adalah baris pertamamu.', style: 'normal'},
      { id: Date.now() + '3', text: '- Klik dua kali pada judul tab untuk mengeditnya.', style: 'normal'},
      { id: Date.now() + '4', text: '- Tambahkan baris baru di bawah.', style: 'normal'}
    ] 
  },
];

export default function Home() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();
  const titleInputRef = useRef<HTMLTextAreaElement>(null);
  const { setTheme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
    try {
      const savedTabs = localStorage.getItem('sipaling-notes-tabs');
      const savedActiveTab = localStorage.getItem('sipaling-notes-activeTab');
      
      let parsedTabs: Tab[] = [];

      if (savedTabs) {
        const rawTabs = JSON.parse(savedTabs);
        // Migrasi data dari format lama
        parsedTabs = rawTabs.map((tab: any) => {
          if (typeof tab.content === 'string') {
            return {
              ...tab,
              content: tab.content.split('\n').map((lineText: string) => ({
                id: Date.now() + Math.random().toString(),
                text: lineText,
                style: 'normal',
              })),
            };
          }
          // Pastikan setiap baris memiliki properti 'style'
          const contentWithStyle = tab.content.map((line: any) => ({
            ...line,
            style: line.style || 'normal',
          }));

          return { ...tab, content: contentWithStyle };
        });

        if (Array.isArray(parsedTabs) && parsedTabs.length > 0) {
            setTabs(parsedTabs);
            if (savedActiveTab && parsedTabs.some((t: Tab) => t.id === savedActiveTab)) {
                setActiveTab(savedActiveTab);
            } else {
                setActiveTab(parsedTabs[0].id);
            }
        } else {
            setTabs(defaultTabs);
            setActiveTab(defaultTabs[0].id);
        }
      } else {
        setTabs(defaultTabs);
        setActiveTab(defaultTabs[0].id);
      }
    } catch (error) {
      console.error("Gagal memuat catatan dari localStorage", error);
      setTabs(defaultTabs);
      setActiveTab(defaultTabs[0].id);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('sipaling-notes-tabs', JSON.stringify(tabs));
      if (activeTab) {
        localStorage.setItem('sipaling-notes-activeTab', activeTab);
      }
    }
  }, [tabs, activeTab, isMounted]);

  useEffect(() => {
    if (editingTabId && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTabId]);

  const autoResizeTextarea = (element: HTMLTextAreaElement) => {
    if (element) {
      element.style.height = 'auto';
      element.style.height = (element.scrollHeight) + 'px';
    }
  };

  useEffect(() => {
    document.querySelectorAll('textarea').forEach(textarea => {
      autoResizeTextarea(textarea);
    });
  }, [tabs, activeTab]);

  const handleAddTab = () => {
    const newTabId = Date.now().toString();
    const newTab: Tab = {
      id: newTabId,
      title: `Catatan ${tabs.length + 1}`,
      content: [{id: Date.now().toString(), text: '', style: 'normal' }],
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newTabId);
  };

  const handleRemoveTab = (tabId: string) => {
    if (tabs.length === 1) {
      toast({
        variant: "destructive",
        title: "Tidak dapat menghapus tab terakhir",
        description: "Anda harus memiliki setidaknya satu catatan.",
      });
      return;
    }

    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    const newTabs = tabs.filter((tab) => tab.id !== tabId);
    setTabs(newTabs);

    if (activeTab === tabId) {
       const newActiveIndex = Math.max(0, tabIndex - 1);
       setActiveTab(newTabs[newActiveIndex]?.id || '');
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const updateLine = (lineId: string, newText: string) => {
    setTabs(tabs.map(tab => {
        if (tab.id !== activeTab) return tab;
        const newContent = tab.content.map(line => line.id === lineId ? { ...line, text: newText } : line);
        return { ...tab, content: newContent };
    }));
  };

  const updateLineStyle = (lineId: string, newStyle: 'normal' | 'heading') => {
     setTabs(tabs.map(tab => {
        if (tab.id !== activeTab) return tab;
        const newContent = tab.content.map(line => line.id === lineId ? { ...line, style: newStyle } : line);
        return { ...tab, content: newContent };
    }));
  }
  
  const handleAddLine = (afterLineId?: string) => {
     setTabs(tabs.map(tab => {
        if (tab.id !== activeTab) return tab;
        
        const newLine: Line = { id: Date.now().toString(), text: '', style: 'normal'};
        let newContent = [...tab.content];
        
        if (afterLineId) {
            const index = newContent.findIndex(line => line.id === afterLineId);
            if (index > -1) {
                newContent.splice(index + 1, 0, newLine);
            } else {
                 newContent.push(newLine);
            }
        } else {
            if (newContent.length === 1 && newContent[0].text === '') {
              newContent = [newLine];
            } else {
              newContent.push(newLine);
            }
        }

        return { ...tab, content: newContent };
    }));
  };


  const handleRemoveLine = (lineId: string) => {
    setTabs(tabs.map(tab => {
        if (tab.id !== activeTab) return tab;

        if (tab.content.length <= 1) {
            return { ...tab, content: [{ id: Date.now().toString(), text: '', style: 'normal'}] };
        }

        const newContent = tab.content.filter(line => line.id !== lineId);
        return { ...tab, content: newContent };
    }));
  };

  const copyLine = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        
        textArea.style.position = "fixed";
        textArea.style.top = "-9999px";
        textArea.style.left = "-9999px";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
        } catch (err) {
          throw new Error('Fallback copy command failed');
        } finally {
          document.body.removeChild(textArea);
        }
      }

      toast({
        title: 'Disalin ke papan klip!',
        description: `"${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
      });

    } catch (error) {
      toast({
        variant: "destructive",
        title: 'Gagal menyalin!',
        description: 'Papan klip tidak dapat diakses dari browser Anda.'
      });
      console.error('Copy failed', error);
    }
  };

  const handleStartEditingTitle = (tab: Tab) => {
    setEditingTabId(tab.id);
    setEditingTitle(tab.title);
  };

  const handleSaveTitle = () => {
    if (!editingTabId) return;
    setTabs(tabs.map(tab => tab.id === editingTabId ? { ...tab, title: editingTitle.trim() || "Tanpa Judul" } : tab));
    setEditingTabId(null);
  };

  if (!isMounted) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
        </div>
    );
  }

  const currentTab = tabs.find(t => t.id === activeTab);

  return (
    <main className="container mx-auto p-4 md:p-8 font-headline flex flex-col h-screen max-h-screen overflow-hidden">
      <header className="flex items-start justify-between gap-2 md:gap-4 mb-6">
        <div className="flex items-center gap-2 md:gap-4">
          <NotebookText className="w-8 h-8 md:w-10 md:h-10 text-primary shrink-0 mt-1" />
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">SipalingNoted</h1>
              <span className="text-xs md:text-sm text-muted-foreground font-normal">
                by{' '}
                <a
                  href="https://faaadelmr.pages.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline hover:text-foreground"
                >
                  faaadelmr
                </a>
              </span>
            </div>
            <p className="text-sm md:text-base text-muted-foreground">Catatan itu harusnya mudah di copy.</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Palette className="h-5 w-5" />
              <span className="sr-only">Ubah tema</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("theme-default")}>
              Default
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("theme-rose")}>
              Mawar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("theme-green")}>
              Hijau
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("theme-orange")}>
              Jeruk
            </DropdownMenuItem>
             <DropdownMenuItem onClick={() => setTheme("dark")}>
              Gelap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      
      <div className="flex-grow flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex flex-col flex-grow min-h-0">
          <div className="flex items-center border-b">
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="bg-transparent p-0 border-0 h-auto">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={cn(
                      "relative group mr-1 border-b-2 border-transparent rounded-b-none data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:shadow-none hover:bg-muted/50 py-3 px-4 transition-colors",
                      editingTabId === tab.id ? 'p-0' : ''
                    )}
                    onDoubleClick={() => handleStartEditingTitle(tab)}
                  >
                    {editingTabId === tab.id ? (
                      <Textarea
                        ref={titleInputRef}
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={handleSaveTitle}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveTitle();
                          }
                        }}
                        className="h-full px-4 py-3 text-sm bg-background/50 focus-visible:ring-accent w-full resize-none overflow-hidden min-h-[40px] text-center"
                        rows={1}
                        onInput={(e) => autoResizeTextarea(e.currentTarget)}
                      />
                    ) : (
                      <>
                        <span title={tab.title}>{tab.title}</span>
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          aria-label="Hapus tab"
                          className="absolute top-1/2 right-0 -translate-y-1/2 w-6 h-6 ml-2 opacity-0 group-hover:opacity-100 data-[state=active]:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); handleRemoveTab(tab.id); }}
                        >
                          <div>
                            <X className="w-4 h-4" />
                          </div>
                        </Button>
                      </>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
            <Button variant="ghost" size="icon" onClick={() => handleAddTab()} className="ml-2" aria-label="Tambah tab baru">
              <Plus className="w-5 h-5 text-accent hover:text-accent/80 transition-colors" />
            </Button>
          </div>
          
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="flex-grow mt-4 min-h-0">
              <Card className="shadow-md border-transparent bg-card/50 h-full flex flex-col">
                <CardContent className="p-2 md:p-6 flex-grow flex flex-col min-h-0">
                  <ScrollArea className="flex-grow">
                    <div className="space-y-1 pr-4">
                      {currentTab && currentTab.id === tab.id && currentTab.content.map((line, index) => (
                        <div key={line.id} className="flex items-start group gap-1 sm:gap-2 rounded-md hover:bg-muted/50 transition-colors">
                          <Textarea
                            value={line.text}
                            onChange={(e) => {
                              updateLine(line.id, e.target.value);
                              autoResizeTextarea(e.target);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddLine(line.id);
                                }
                            }}
                            placeholder="Ketik sesuatu..."
                            className={cn(
                              "flex-grow bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 resize-none min-h-[40px]",
                              {
                                'text-lg md:text-xl font-bold': line.style === 'heading',
                                'text-base': line.style === 'normal',
                              }
                            )}
                            onInput={(e) => autoResizeTextarea(e.currentTarget)}
                          />
                          <div className="flex items-center opacity-100 md:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity pr-1 sm:pr-2 flex-shrink-0 pt-1">
                            <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="icon" aria-label="Gaya baris">
                                    <Wand2 className="w-4 h-4 text-muted-foreground hover:text-accent transition-colors" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-1">
                                    <div className="flex flex-col gap-1">
                                        <Button variant="ghost" className="justify-start px-2" onClick={() => updateLineStyle(line.id, 'heading')}>Judul</Button>
                                        <Button variant="ghost" className="justify-start px-2" onClick={() => updateLineStyle(line.id, 'normal')}>Normal</Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <Button variant="ghost" size="icon" onClick={() => copyLine(line.text)} aria-label="Salin baris">
                              <Copy className="w-4 h-4 text-muted-foreground hover:text-accent transition-colors" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveLine(line.id)} aria-label="Hapus baris">
                              <X className="w-4 h-4 text-destructive/70 hover:text-destructive transition-colors" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="pt-4">
                    <Button variant="outline" size="sm" onClick={() => handleAddLine()} className="text-accent border-accent/50 hover:bg-accent/10 hover:text-accent">
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Baris
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </main>
  );
}
