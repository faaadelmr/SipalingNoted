"use client";

import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Copy, NotebookText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

type Tab = {
  id: string;
  title: string;
  content: string;
};

const defaultTabs: Tab[] = [
  { id: '1', title: 'My First Note', content: 'Welcome to SipintarNoted!\n- This is your first line.\n- Double-click a tab title to edit it.\n- Add new lines below.' },
];

export default function Home() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
    try {
      const savedTabs = localStorage.getItem('sipintar-notes-tabs');
      const savedActiveTab = localStorage.getItem('sipintar-notes-activeTab');
      if (savedTabs) {
        const parsedTabs = JSON.parse(savedTabs);
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
      console.error("Failed to load notes from localStorage", error);
      setTabs(defaultTabs);
      setActiveTab(defaultTabs[0].id);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('sipintar-notes-tabs', JSON.stringify(tabs));
      if (activeTab) {
        localStorage.setItem('sipintar-notes-activeTab', activeTab);
      }
    }
  }, [tabs, activeTab, isMounted]);

  useEffect(() => {
    if (editingTabId && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTabId]);

  const handleAddTab = () => {
    const newTabId = Date.now().toString();
    const newTab: Tab = {
      id: newTabId,
      title: `Note ${tabs.length + 1}`,
      content: '',
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newTabId);
  };

  const handleRemoveTab = (tabId: string) => {
    if (tabs.length === 1) {
      toast({
        variant: "destructive",
        title: "Cannot delete last tab",
        description: "You must have at least one note.",
      });
      return;
    }

    const newTabs = tabs.filter((tab) => tab.id !== tabId);
    setTabs(newTabs);

    if (activeTab === tabId) {
      setActiveTab(newTabs[0]?.id || '');
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleLineChange = (lineIndex: number, newValue: string) => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    if (!currentTab) return;

    const lines = currentTab.content.split('\n');
    lines[lineIndex] = newValue;
    const newContent = lines.join('\n');

    setTabs(tabs.map(tab => tab.id === activeTab ? { ...tab, content: newContent } : tab));
  };
  
  const handleAddLine = () => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    if (!currentTab) return;

    const newContent = currentTab.content === '' ? '' : currentTab.content + '\n';
    setTabs(tabs.map(tab => tab.id === activeTab ? { ...tab, content: newContent } : tab));
  };


  const handleRemoveLine = (lineIndex: number) => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    if (!currentTab) return;
    
    const lines = currentTab.content.split('\n');
    if (lines.length <= 1) {
        handleLineChange(0, "");
        return;
    }

    lines.splice(lineIndex, 1);
    const newContent = lines.join('\n');
    setTabs(tabs.map(tab => tab.id === activeTab ? { ...tab, content: newContent } : tab));
  };

  const copyLine = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copied to clipboard!',
        description: `"${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
      });
    }, () => {
      toast({
        variant: "destructive",
        title: 'Failed to copy!',
      });
    });
  };

  const handleStartEditingTitle = (tab: Tab) => {
    setEditingTabId(tab.id);
    setEditingTitle(tab.title);
  };

  const handleSaveTitle = () => {
    if (!editingTabId) return;
    setTabs(tabs.map(tab => tab.id === editingTabId ? { ...tab, title: editingTitle.trim() || "Untitled" } : tab));
    setEditingTabId(null);
  };

  const autoResizeTextarea = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = (element.scrollHeight) + 'px';
  };

  useEffect(() => {
    document.querySelectorAll('textarea').forEach(textarea => {
      autoResizeTextarea(textarea);
    });
  }, [tabs, activeTab]);


  if (!isMounted) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
        </div>
    );
  }

  const linesForCurrentTab = (tabs.find(t => t.id === activeTab)?.content ?? '') === '' ? [''] : (tabs.find(t => t.id === activeTab)?.content ?? '').split('\n');

  return (
    <main className="container mx-auto p-4 md:p-8 font-headline">
      <header className="flex items-center gap-2 md:gap-4 mb-6">
        <NotebookText className="w-8 h-8 md:w-10 md:h-10 text-primary shrink-0" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">SipintarNoted</h1>
          <p className="text-sm md:text-base text-muted-foreground">Your simple and smart notes, organized.</p>
        </div>
      </header>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
                    <Input
                      ref={titleInputRef}
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={handleSaveTitle}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                      className="h-full px-4 py-3 text-sm bg-background/50 focus-visible:ring-accent"
                    />
                  ) : (
                    <>
                      <span className="max-w-[100px] md:max-w-[150px] truncate" title={tab.title}>{tab.title}</span>
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        aria-label="Remove tab"
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
          <Button variant="ghost" size="icon" onClick={handleAddTab} className="ml-2" aria-label="Add new tab">
            <Plus className="w-5 h-5 text-accent hover:text-accent/80 transition-colors" />
          </Button>
        </div>
        
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <Card className="mt-4 shadow-md border-transparent bg-card/50">
              <CardContent className="p-2 md:p-6">
                <div className="space-y-1">
                  {linesForCurrentTab.map((line, index) => (
                    <div key={`${tab.id}-${index}`} className="flex items-start group gap-1 sm:gap-2 rounded-md hover:bg-muted/50 transition-colors">
                      <Textarea
                        value={line}
                        onChange={(e) => {
                          handleLineChange(index, e.target.value);
                          autoResizeTextarea(e.target);
                        }}
                        placeholder="Type something..."
                        className="flex-grow bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 text-base resize-none overflow-hidden min-h-[40px]"
                        rows={1}
                      />
                      <div className="flex items-center opacity-100 md:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity pr-1 sm:pr-2 flex-shrink-0 pt-1">
                        <Button variant="ghost" size="icon" onClick={() => copyLine(line)} aria-label="Copy line">
                          <Copy className="w-4 h-4 text-muted-foreground hover:text-accent transition-colors" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveLine(index)} aria-label="Remove line">
                          <X className="w-4 h-4 text-destructive/70 hover:text-destructive transition-colors" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={handleAddLine} className="mt-4 text-accent border-accent/50 hover:bg-accent/10 hover:text-accent">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Line
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </main>
  );
}
