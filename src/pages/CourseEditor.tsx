import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Save, Sparkles, UploadCloud, FolderTree, ImageIcon, FileAudio, FileVideo, FileText, ArrowLeft, Layers } from "lucide-react";
import { Editor } from "@tinymce/tinymce-react";

interface Module { id: string; title: string; module_order: number; }
interface Lesson { id: string; title: string; lesson_order: number; module_id: string; }

const iconForMime = (mime?: string) => {
  if (!mime) return FileText;
  if (mime.startsWith("image")) return ImageIcon;
  if (mime.startsWith("audio")) return FileAudio;
  if (mime.startsWith("video")) return FileVideo;
  return FileText;
};

export default function CourseEditor() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [contentHtml, setContentHtml] = useState<string>("");

  // Media modal state
  const [mediaOpen, setMediaOpen] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  // AI Assist modal
  const [aiOpen, setAiOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    document.title = courseTitle ? `${courseTitle} | Course Editor` : "Course Editor";
    // Basic SEO tags
    const metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = "Edit course content with a traditional WYSIWYG editor, media library, and AI assist.";
      document.head.appendChild(m);
    }
    const linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      const l = document.createElement("link");
      l.rel = "canonical";
      l.href = window.location.href;
      document.head.appendChild(l);
    }
  }, [courseTitle]);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const { data: auth } = await supabase.auth.getUser();
        setUserId(auth.user?.id ?? null);
        if (!auth.user) {
          navigate("/auth");
          return;
        }
        if (!courseId) return;
        // Load course title
        const { data: course } = await supabase
          .from("courses")
          .select("title")
          .eq("id", courseId)
          .maybeSingle();
        setCourseTitle(course?.title ?? "");

        // Load structure
        const [{ data: mods }, { data: less }] = await Promise.all([
          supabase.from("course_modules").select("id,title,module_order").eq("course_id", courseId).order("module_order"),
          supabase.from("course_lessons").select("id,title,lesson_order,module_id").in(
            "module_id",
            (await supabase.from("course_modules").select("id").eq("course_id", courseId)).data?.map((m) => m.id) || []
          ).order("lesson_order")
        ]);
        setModules(mods || []);
        setLessons(less || []);
        setSelectedLessonId(less && less.length ? less[0].id : null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [courseId, navigate]);

  useEffect(() => {
    const loadLessonContent = async () => {
      if (!selectedLessonId || !userId) return;
      const { data: block } = await supabase
        .from("lesson_content_blocks")
        .select("id, content, block_order")
        .eq("lesson_id", selectedLessonId)
        .eq("block_type", "text")
        .eq("creator_id", userId)
        .order("block_order")
        .maybeSingle();
      setContentHtml((block as any)?.content?.html ?? "");
      // Load files list for course media
      if (courseId) {
        const { data: mediaRows } = await supabase
          .from("course_media_files")
          .select("id,file_name,file_path,mime_type,created_at")
          .eq("course_id", courseId)
          .order("created_at", { ascending: false });
        setFiles(mediaRows || []);
      }
    };
    loadLessonContent();
  }, [selectedLessonId, userId, courseId]);

  const selectedModuleLessons = useMemo(
    () => (modId: string) => lessons.filter((l) => l.module_id === modId).sort((a, b) => a.lesson_order - b.lesson_order),
    [lessons]
  );

  const saveContent = async () => {
    if (!selectedLessonId || !userId) return;
    setSaving(true);
    try {
      // find existing block
      const { data: existing } = await supabase
        .from("lesson_content_blocks")
        .select("id, block_order")
        .eq("lesson_id", selectedLessonId)
        .eq("block_type", "text")
        .eq("creator_id", userId)
        .maybeSingle();

      const content = { html: contentHtml };

      if (existing?.["id"]) {
        await supabase
          .from("lesson_content_blocks")
          .update({ content })
          .eq("id", existing.id);
      } else {
        // compute next order
        const { data: maxOrder } = await supabase
          .from("lesson_content_blocks")
          .select("block_order")
          .eq("lesson_id", selectedLessonId)
          .order("block_order", { ascending: false })
          .limit(1)
          .maybeSingle();
        const nextOrder = (maxOrder?.block_order ?? 0) + 1;
        await supabase.from("lesson_content_blocks").insert({
          lesson_id: selectedLessonId,
          block_type: "text",
          block_order: nextOrder,
          content,
          creator_id: userId,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!courseId || !userId) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `${courseId}/${userId}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("course-media")
        .upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      await supabase.from("course_media_files").insert({
        course_id: courseId,
        creator_id: userId,
        file_name: file.name,
        file_path: path,
        file_size: file.size,
        file_type: file.type.split("/")[0],
        mime_type: file.type,
      });

      const { data: mediaRows } = await supabase
        .from("course_media_files")
        .select("id,file_name,file_path,mime_type,created_at")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false });
      setFiles(mediaRows || []);
    } finally {
      setUploading(false);
    }
  };

  const insertMediaIntoEditor = async (filePath: string, mime: string) => {
    const { data: signed, error } = await supabase.storage
      .from("course-media")
      .createSignedUrl(filePath, 60 * 60);
    if (error) {
      console.error(error);
      return;
    }
    const url = signed?.signedUrl;
    if (!url) return;
    const ed = editorRef.current;
    if (!ed) return;
    if (mime.startsWith("image")) {
      ed.insertContent(`<img src="${url}" alt="Course image" style="max-width:100%;height:auto;"/>`);
    } else if (mime.startsWith("video")) {
      ed.insertContent(`<video controls style="max-width:100%"><source src="${url}" type="${mime}"/></video>`);
    } else if (mime.startsWith("audio")) {
      ed.insertContent(`<audio controls src="${url}"></audio>`);
    } else {
      const name = filePath.split("/").pop();
      ed.insertContent(`<p><a href="${url}" target="_blank" rel="noopener">${name}</a></p>`);
    }
  };

  const runAI = async () => {
    if (!prompt.trim()) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { prompt },
      });
      if (error) throw error;
      const text = (data as any)?.generatedText || (data as any)?.content || "";
      const ed = editorRef.current;
      if (ed && text) {
        ed.insertContent(`<p>${text.replace(/\n/g, "<br/>")}</p>`);
      }
      setAiOpen(false);
      setPrompt("");
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading editor...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/instructional-designer")}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <FolderTree className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">{courseTitle || "Course"} • Content Editor</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/instructional-designer")}
              className="text-muted-foreground"
            >
              <Layers className="h-4 w-4 mr-1" />
              Structure Editor
            </Button>
            <Dialog open={aiOpen} onOpenChange={setAiOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm">
                  <Sparkles className="h-4 w-4 mr-1" /> AI Assist
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate content with AI</DialogTitle>
                </DialogHeader>
                <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe what you want to generate..." />
                <div className="flex justify-end">
                  <Button onClick={runAI} disabled={aiLoading}>
                    {aiLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Generate
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={mediaOpen} onOpenChange={setMediaOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <UploadCloud className="h-4 w-4 mr-1" /> Media Library
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Course Media</DialogTitle>
                </DialogHeader>
                <div className="flex items-center gap-3">
                  <Input type="file" onChange={handleFileUpload} />
                  <Button disabled={uploading}>{uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Upload</Button>
                </div>
                <Separator className="my-4" />
                <div className="grid grid-cols-1 gap-2 max-h-80 overflow-auto">
                  {files.map((f) => {
                    const Icon = iconForMime(f.mime_type);
                    return (
                      <Card key={f.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => insertMediaIntoEditor(f.file_path, f.mime_type)}>
                        <CardContent className="p-3 flex items-center gap-3">
                          <Icon className="h-5 w-5 text-primary" />
                          <div className="text-sm">
                            <div className="font-medium">{f.file_name}</div>
                            <div className="text-muted-foreground">{new Date(f.created_at).toLocaleString()}</div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={saveContent} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Save
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-4 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Course Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="structure">
                <TabsList className="w-full">
                  <TabsTrigger value="structure" className="flex-1">Structure</TabsTrigger>
                  <TabsTrigger value="search" className="flex-1">Search</TabsTrigger>
                </TabsList>
                <TabsContent value="structure">
                  <div className="space-y-2 mt-3">
                    {modules.sort((a,b)=>a.module_order-b.module_order).map((m) => (
                      <div key={m.id} className="">
                        <div className="text-sm font-medium mb-2">{m.module_order}. {m.title}</div>
                        <div className="pl-3 space-y-1">
                          {selectedModuleLessons(m.id).map((l) => (
                            <button
                              key={l.id}
                              className={`w-full text-left text-sm rounded px-2 py-1 transition ${selectedLessonId===l.id?"bg-primary/10 text-primary":"hover:bg-muted"}`}
                              onClick={() => setSelectedLessonId(l.id)}
                            >
                              {m.module_order}.{l.lesson_order} {l.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="search">
                  <Input placeholder="Search lessons" />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </aside>

        <main className="col-span-12 md:col-span-8 lg:col-span-9">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <Editor
                onInit={(_evt, editor) => (editorRef.current = editor)}
                apiKey={"no-api-key"}
                tinymceScriptSrc="https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js"
                initialValue={contentHtml}
                value={contentHtml}
                onEditorChange={(v) => setContentHtml(v)}
                init={{
                  menubar: true,
                  height: 560,
                  branding: false,
                  skin: "oxide",
                  content_css: "default",
                  plugins: [
                    "advlist","autolink","lists","link","image","charmap","preview","anchor","searchreplace","visualblocks","code","fullscreen","insertdatetime","media","table","help","wordcount"
                  ],
                  toolbar:
                    "undo redo | blocks | bold italic underline forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | removeformat | code preview",
                  image_caption: true,
                }}
              />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
