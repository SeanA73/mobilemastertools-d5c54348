import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { 
  Plus, Trash2, Search, Filter, Grid, List, Edit3, Save, X, Eye, EyeOff,
  FileText, Folder, FolderPlus, Tag, Star, Archive, LinkIcon, ImageIcon, Mic,
  Camera, Download, Upload, Copy, Share2, Settings, BookOpen, Clock,
  Hash, AtSign, MoreHorizontal, ChevronRight, ChevronDown, FileCode,
  TableIcon, ListOrdered, Quote, Code, Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Heading3
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import TiptapLink from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertNoteSchema, type Note, type NoteFolder, type NoteTemplate } from "@shared/schema";
import WebClipper from "./web-clipper";
import QuickCapture from "./quick-capture";

type NoteFormData = z.infer<typeof insertNoteSchema>;

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapImage.configure({
        inline: true,
        allowBase64: true,
      }),
      TiptapLink.configure({
        openOnClick: false,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  };

  const addTable = () => {
    // Simple HTML table insertion
    const tableHTML = `
      <table>
        <tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr>
        <tr><td>Cell 1</td><td>Cell 2</td><td>Cell 3</td></tr>
        <tr><td>Cell 4</td><td>Cell 5</td><td>Cell 6</td></tr>
      </table>
    `;
    editor?.commands.insertContent(tableHTML);
  };

  if (!editor) {
    return <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />;
  }

  return (
    <div className="border rounded-lg">
      {/* Toolbar */}
      <div className="border-b p-2 flex flex-wrap gap-1">
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <Heading3 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={editor.isActive('taskList') ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive('codeBlock') ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={addImage}>
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={addLink}>
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={addTable}>
            <TableIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent 
        editor={editor} 
        className="min-h-[200px] max-h-[600px] overflow-y-auto"
      />
    </div>
  );
}

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  showPreview?: boolean;
}

function MarkdownEditor({ content, onChange, showPreview = false }: MarkdownEditorProps) {
  return (
    <div className={`grid ${showPreview ? 'grid-cols-2' : 'grid-cols-1'} gap-4 h-96`}>
      <div className="border rounded-lg">
        <div className="border-b p-2 bg-gray-50 dark:bg-gray-800">
          <span className="text-sm font-medium">Markdown</span>
        </div>
        <Textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="# Your note title

Write your content in **Markdown**...

- List item 1
- List item 2

```javascript
console.log('Code blocks supported');
```"
          className="h-full border-0 resize-none font-mono text-sm"
        />
      </div>
      
      {showPreview && (
        <div className="border rounded-lg">
          <div className="border-b p-2 bg-gray-50 dark:bg-gray-800">
            <span className="text-sm font-medium">Preview</span>
          </div>
          <ScrollArea className="h-full p-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {content || '*Preview will appear here...*'}
              </ReactMarkdown>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

export default function EnhancedNotesTool() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [editorMode, setEditorMode] = useState<'rich' | 'markdown'>('rich');
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  
  // Local storage for notes (fallback when no database)
  const [localNotes, setLocalNotes] = useState<Note[]>([]);
  
  // Load from localStorage on mount - fast synchronous read
  useEffect(() => {
    const stored = localStorage.getItem('enhanced-notes');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLocalNotes(parsed.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt),
          lastViewedAt: n.lastViewedAt ? new Date(n.lastViewedAt) : null,
        })));
      } catch (e) {
        console.error('Failed to load notes from localStorage');
      }
    }
  }, []);
  
  // Save to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('enhanced-notes', JSON.stringify(localNotes));
  }, [localNotes]);

  const form = useForm<NoteFormData>({
    resolver: zodResolver(insertNoteSchema),
    defaultValues: {
      title: "",
      content: "",
      markdownContent: "",
      contentType: "rich",
      folder: "General",
      tags: [],
      smartTags: [],
      linkedNotes: [],
      attachments: {},
      metadata: {},
      outline: {},
      isFavorite: false,
      isArchived: false,
      wordCount: 0,
      readingTime: 0,
    },
  });

  // Query for fetching notes from server (will fallback to localStorage)
  // Add timeout and make it non-blocking - show UI immediately with localNotes
  const { data: serverNotes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["/api/notes"],
    queryFn: async () => {
      // Add timeout to prevent long waits
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      try {
        const res = await fetch("/api/notes", {
          credentials: "include",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          return await res.json();
        }
        return [];
      } catch (error) {
        clearTimeout(timeoutId);
        return []; // Return empty array on timeout/error
      }
    },
    retry: false,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 60000, // Keep in cache for 1 minute
  });
  
  // Use server notes if available, otherwise use localStorage
  // Don't wait for server - show localNotes immediately
  const notes = serverNotes.length > 0 ? serverNotes : localNotes;

  // Make these queries non-blocking - they'll fail gracefully
  const { data: folders = [] } = useQuery({
    queryKey: ["/api/note-folders"],
    retry: false,
    enabled: false, // Disable by default - endpoints don't exist yet
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["/api/note-templates"],
    retry: false,
    enabled: false, // Disable by default - endpoints don't exist yet
  });

  const createNoteMutation = useMutation({
    mutationFn: async (data: NoteFormData) => {
      // Always use localStorage
      const newNote: Note = {
        id: Date.now(),
        userId: 'local-user',
        title: data.title,
        content: data.content,
        markdownContent: data.markdownContent || null,
        contentType: data.contentType || 'rich',
        folder: data.folder || 'General',
        parentFolderId: null,
        tags: data.tags || [],
        smartTags: [],
        linkedNotes: [],
        templateId: null,
        attachments: null,
        metadata: null,
        outline: null,
        isFavorite: false,
        isArchived: false,
        wordCount: data.content.split(/\s+/).length,
        readingTime: Math.ceil(data.content.split(/\s+/).length / 200),
        lastViewedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setLocalNotes(prev => [newNote, ...prev]);
      return newNote;
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Note created successfully ✓" });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Note> & { id: number }) => {
      // Update in localStorage
      setLocalNotes(prev => prev.map(note =>
        note.id === id
          ? { ...note, ...data, updatedAt: new Date() }
          : note
      ));
      return { id, ...data };
    },
    onSuccess: () => {
      setEditingNote(null);
      toast({ title: "Note updated successfully ✓" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: number) => {
      // Delete from localStorage
      setLocalNotes(prev => prev.filter(note => note.id !== id));
      return id;
    },
    onSuccess: () => {
      toast({ title: "Note deleted successfully ✓" });
    },
  });

  const filteredNotes = useMemo(() => {
    let filtered = (notes as any[]).filter((note: Note) => {
      if (!showArchived && note.isArchived) return false;
      if (selectedFolder !== 'all' && note.folder !== selectedFolder) return false;
      if (selectedTags.length > 0 && !selectedTags.some(tag => note.tags?.includes(tag))) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return note.title.toLowerCase().includes(query) || 
               note.content.toLowerCase().includes(query) ||
               note.tags?.some(tag => tag.toLowerCase().includes(query));
      }
      return true;
    });

    return filtered.sort((a: Note, b: Note) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    });
  }, [notes, selectedFolder, selectedTags, searchQuery, showArchived]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    (notes as any[]).forEach((note: Note) => {
      note.tags?.forEach(tag => tags.add(tag));
      note.smartTags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [notes]);

  const allFolders = useMemo(() => {
    const folderSet = new Set((notes as any[]).map((note: Note) => note.folder).filter(Boolean));
    return Array.from(folderSet);
  }, [notes]);

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  const generateOutline = (content: string) => {
    const headingRegex = /<h([1-6]).*?>(.*?)<\/h[1-6]>/g;
    const outline: Array<{level: number, text: string, id: string}> = [];
    let match;
    
    while ((match = headingRegex.exec(content)) !== null) {
      outline.push({
        level: parseInt(match[1]),
        text: match[2].replace(/<[^>]*>/g, ''),
        id: match[2].toLowerCase().replace(/[^a-z0-9]/g, '-')
      });
    }
    
    return outline;
  };

  const onSubmit = (data: NoteFormData) => {
    const content = editorMode === 'rich' ? data.content : data.markdownContent || '';
    const wordCount = content.split(/\s+/).length;
    const readingTime = calculateReadingTime(content);
    const outline = generateOutline(content);

    const noteData = {
      ...data,
      contentType: editorMode,
      wordCount,
      readingTime,
      outline,
    };

    if (editingNote) {
      updateNoteMutation.mutate({ ...noteData, id: editingNote.id });
    } else {
      createNoteMutation.mutate(noteData);
    }
  };

  const handleTemplateSelect = (template: NoteTemplate) => {
    form.setValue('title', template.name);
    form.setValue('content', template.content || '');
    form.setValue('markdownContent', template.markdownContent || '');
    form.setValue('contentType', template.contentType || 'rich');
    form.setValue('tags', template.tags || []);
    setEditorMode((template.contentType as 'rich' | 'markdown') || 'rich');
    setShowTemplates(false);
  };

  // Only show loading if we have no local notes AND server is still loading
  // This prevents blocking the UI when localStorage has data
  const shouldShowLoading = notesLoading && localNotes.length === 0 && serverNotes.length === 0;
  
  if (shouldShowLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
          <div className="lg:col-span-3 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Enhanced Notes
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
              >
                <Archive className="h-4 w-4 mr-2" />
                {showArchived ? 'Hide Archived' : 'Show Archived'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplates(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Templates
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Note
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                      {editingNote ? 'Edit Note' : 'Create New Note'}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Mode:</span>
                        <Tabs value={editorMode} onValueChange={(v) => setEditorMode(v as 'rich' | 'markdown')}>
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="rich">Rich Text</TabsTrigger>
                            <TabsTrigger value="markdown">Markdown</TabsTrigger>
                          </TabsList>
                        </Tabs>
                        {editorMode === 'markdown' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowMarkdownPreview(!showMarkdownPreview)}
                          >
                            {showMarkdownPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Note title" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="folder"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Folder</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {allFolders.map((folder) => (
                                    <SelectItem key={folder as string} value={folder as string}>{folder as string}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>

                      {editorMode === 'rich' ? (
                        <FormField
                          control={form.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Content</FormLabel>
                              <FormControl>
                                <RichTextEditor
                                  content={field.value || ''}
                                  onChange={field.onChange}
                                  placeholder="Start writing your note..."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <FormField
                          control={form.control}
                          name="markdownContent"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Content (Markdown)</FormLabel>
                              <FormControl>
                                <MarkdownEditor
                                  content={field.value || ''}
                                  onChange={field.onChange}
                                  showPreview={showMarkdownPreview}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tags</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter tags separated by commas"
                                value={field.value?.join(', ') || ''}
                                onChange={(e) => field.onChange(e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center gap-4">
                        <FormField
                          control={form.control}
                          name="isFavorite"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch
                                  checked={field.value || false}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm">Favorite</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button type="submit" className="w-full">
                        {editingNote ? 'Update Note' : 'Create Note'}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedFolder} onValueChange={setSelectedFolder}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Folders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Folders</SelectItem>
                {allFolders.map((folder) => (
                  <SelectItem key={folder as string} value={folder as string}>{folder as string}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            >
              {viewMode === 'list' ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </Button>
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Filter by tags:</span>
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedTags(prev =>
                      prev.includes(tag)
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    );
                  }}
                >
                  #{tag}
                </Badge>
              ))}
              {selectedTags.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTags([])}
                  className="h-6 px-2"
                >
                  Clear
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Capture & Web Clipper */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <QuickCapture />
        <WebClipper />
      </div>

      {/* Notes Grid/List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
        {filteredNotes.map((note: Note) => (
          <Card key={note.id} className="group hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate flex items-center gap-2">
                    {note.isFavorite && <Star className="h-4 w-4 text-yellow-500" />}
                    {note.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {note.folder} • {format(new Date(note.updatedAt || new Date()), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingNote(note);
                      form.reset({
                        title: note.title,
                        content: note.content,
                        markdownContent: note.markdownContent || '',
                        contentType: note.contentType || 'rich',
                        folder: note.folder,
                        tags: note.tags || [],
                        isFavorite: note.isFavorite,
                      });
                      setEditorMode((note.contentType as 'rich' | 'markdown') || 'rich');
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNoteMutation.mutate(note.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div 
                className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 prose prose-sm dark:prose-invert"
                dangerouslySetInnerHTML={{ 
                  __html: note.content.length > 200 ? note.content.substring(0, 200) + '...' : note.content 
                }}
              />
              
              <div className="mt-3 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {note.tags?.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                  {note.tags && note.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{note.tags.length - 3}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  {note.readingTime || 1}m read
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No notes found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || selectedTags.length > 0 
                ? 'Try adjusting your search criteria' 
                : 'Create your first note to get started'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Note Templates</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  id: 1,
                  name: "Meeting Notes",
                  description: "Structure for meeting documentation",
                  content: "<h1>Meeting Notes</h1><p><strong>Date:</strong> </p><p><strong>Attendees:</strong> </p><p><strong>Agenda:</strong></p><ul><li></li></ul><p><strong>Action Items:</strong></p><ul><li></li></ul>",
                  category: "meeting",
                  tags: ["meeting", "work"]
                },
                {
                  id: 2,
                  name: "Daily Journal",
                  description: "Daily reflection template",
                  content: "<h1>Daily Journal</h1><p><strong>Date:</strong> </p><p><strong>Mood:</strong> </p><p><strong>Today's Highlights:</strong></p><ul><li></li></ul><p><strong>Challenges:</strong></p><ul><li></li></ul><p><strong>Tomorrow's Goals:</strong></p><ul><li></li></ul>",
                  category: "personal",
                  tags: ["journal", "personal"]
                },
                {
                  id: 3,
                  name: "Project Plan",
                  description: "Project planning template",
                  content: "<h1>Project Plan</h1><p><strong>Project Name:</strong> </p><p><strong>Objective:</strong> </p><p><strong>Timeline:</strong> </p><p><strong>Milestones:</strong></p><ul><li></li></ul><p><strong>Resources:</strong></p><ul><li></li></ul>",
                  category: "project",
                  tags: ["project", "planning"]
                },
                {
                  id: 4,
                  name: "Book Notes",
                  description: "Book reading and notes template",
                  content: "<h1>Book Notes</h1><p><strong>Title:</strong> </p><p><strong>Author:</strong> </p><p><strong>Rating:</strong> </p><p><strong>Key Takeaways:</strong></p><ul><li></li></ul><p><strong>Favorite Quotes:</strong></p><blockquote><p></p></blockquote>",
                  category: "reading",
                  tags: ["book", "reading", "notes"]
                }
              ].map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTemplateSelect(template as any)}>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2">{template.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{template.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}