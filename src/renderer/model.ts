import { Observable } from "kyoka";
import produce from 'immer';
import { v4 as uuidv4 } from 'uuid';

export enum NodeType {
  Text = 'text',
  Image = 'image',
  Anchor = 'anchor',
  Directory = 'directory',
}

export interface Node {
  id: string;
  type?: NodeType;
  created: Date;
  modified: Date;
  tags?: string[];
}

export interface TextNode extends Node {
  type?: NodeType.Text;
  content: string;
}

export interface ImageNode extends Node {
  type?: NodeType.Image;
  fileID: string;
  description: string;
}

export interface AnchorNode extends Node {
  type?: NodeType.Anchor;
  url: string;
  title?: string;
  imageFileID?: string;
  faviconFileID?: string;
  description?: string;
}

export interface DirectoryNode extends Node {
  type?: NodeType.Directory;
  name: string;
}

export interface File {
  id: string;
  type: string;
  name?: string;
  url?: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Library {
  nodes: Node[];
  files: File[];
  tags: Tag[];
}

export interface View {
  type: 'directory' | 'tag' | 'date';
}

export interface DirectoryView extends View {
  type: 'directory';
  path: string;
}

export interface TagView extends View {
  type: 'tag';
  tag: string;
}

export interface DateView extends View {
  type: 'date';
  date: string;
}

export default class Model {
  nodes = new Observable<Node[]>([]);
  files = new Observable<File[]>([]);
  tags = new Observable<Tag[]>([]);
  view = new Observable<View | undefined>(undefined);
  saving = new Observable<boolean>(false);

  constructor() {
  }

  addNode(node: Node) {
    const newNodes = produce(this.nodes.get(), n => {
      n.push(node);
    });

    this.nodes.set(newNodes);
  }

  addTextNode(text: string, tags?: string[]) {
    const now = new Date();
    const id = uuidv4();

    if (tags?.length == 0) {
      tags = undefined;
    }

    this.addNode({ type: NodeType.Text, content: text, tags, created: now, modified: now, id } as TextNode);
    this.save();
  }

  addImageNode(file: File, tags?: string[]) {
    const now = new Date();
    const id = uuidv4()

    if (tags?.length == 0) {
      tags = undefined;
    }

    this.addFile(file);
    this.addNode({ type: NodeType.Image, fileID: file.id, tags, created: now, modified: now, id } as ImageNode);
    this.save();
  }

  removeNode(id: string) {
    const foundIndex = this.nodes.get().findIndex(n => n.id == id);
    const found = this.nodes.get()[foundIndex];

    if (found.type == NodeType.Image) {
      this.removeFile((found as ImageNode).fileID);
    }

    const newNodes = produce(this.nodes.get(), n => {
      n.splice(n.findIndex(n => n.id == id), 1);
    });

    this.nodes.set(newNodes);
    this.save();
  }


  // Files

  addFile(file: File) {
    const newFiles = produce(this.files.get(), f => {
      f.push(file);
    });

    this.files.set(newFiles);
  }

  removeFile(fileID: string) {
    const found = this.files.get().findIndex(f => f.id == fileID);
    bridge.removeFile(this.files.get()[found].id);

    const newFiles = produce(this.files.get(), f => {
      f.splice(f.findIndex(f => f.id == fileID), 1);
    });

    this.files.set(newFiles);
    this.save();
  }

  getFile(fileID: string) {
    const found = this.files.get().find(f => f.id == fileID);
    return found;
  }


  // Tags

  createTag(name: string) {
    const id = uuidv4();

    const newTags = produce(this.tags.get(), t => {
      t.push({ id, name });
    });

    this.tags.set(newTags);
    this.save();
    return id;
  }

  findTag(name: string) {
    return this.tags.get().find(t => t.name.localeCompare(name, undefined, { sensitivity: 'accent' }) == 0);
  }

  removeTag(id: string) {
    // TODO
  }


  // Directories

  findDirectory() {
    // TODO
  }

  createDirectory(path: string) {
    const dirs = path.split('/').filter(d => d.length > 0);

    for (const dir of dirs) {

    }

    // TODO
  }


  // Views

  changeView(view: View | undefined) {
    this.view.set(view);
  }


  // File System

  async loadLibrary() {
    const c = await bridge.readLibrary();

    const data = JSON.parse(c, (key, value) => {
      if (key == 'created' || key == 'modified') {
        return new Date(value);
      }

      return value;
    }) as Library;

    this.nodes.set(data.nodes ?? []);
    this.files.set(data.files ?? []);
    this.tags.set(data.tags ?? []);
  }

  async save() {
    if (this.saving.get()) {
      return;
    }

    this.saving.set(true);

    await bridge.writeLibrary(JSON.stringify({
      nodes: this.nodes.get(),
      files: this.files.get(),
      tags: this.tags.get()
    }));

    this.saving.set(false);
  }
}