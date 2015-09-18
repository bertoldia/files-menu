/*
 * Copyright 2014 Axel von Bertoldi
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 2 of the License, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program; if not, write to:
 * The Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor
 * Boston, MA 02110-1301, USA.
 */

const St = imports.gi.St;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Clutter = imports.gi.Clutter;
const Gettext = imports.gettext.domain("files-menu");
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Self = ExtensionUtils.getCurrentExtension();
const mi = Self.imports.menuItems;
const MenuItem = Self.imports.menuItems.MenuItem;

const ScrollableMenu = new Lang.Class({
  Name: 'ScrollableMenu.ScrollableMenu',
  Extends: PopupMenu.PopupMenuSection,

  _init: function() {
    this.parent();
    let scrollView = new St.ScrollView({
      x_fill: true,
      y_fill: false,
      y_align: St.Align.START,
      overlay_scrollbars: true,
      style_class: 'vfade'
    });
    this.innerMenu = new PopupMenu.PopupMenuSection();
    scrollView.add_actor(this.innerMenu.actor);
    this.actor.add_actor(scrollView);
  },

  addMenuItem: function(item) {
    this.innerMenu.addMenuItem(item);
  },

  removeAll: function() {
    this.innerMenu.removeAll();
  }
});


const DirectoryMenu = new Lang.Class({
  Name: 'DirectoryMenu.DirectoryMenu',
  Extends: PanelMenu.Button,

  _init: function() {
    this.parent(0.0, "FilesMenu");
    this.label = new St.Label({ text: _(homeText) + arrowText,
                               y_expand: true,
                               y_align: Clutter.ActorAlign.CENTER });
    this.actor.add_actor(this.label);
    this.home_dir = Gio.file_new_for_path(GLib.get_home_dir());
    this.current_dir = this.home_dir;

    this.createLayout();

    this.actor.connect('button-press-event', Lang.bind(this, this.loadDirectory));
    // not sure why this is necessary, but it is...
    this.loadDirectory();
  },

  createLayout: function() {
    this.header = new PopupMenu.PopupMenuSection();
    this.menu.addMenuItem(this.header);
    this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
    this.filesList = new ScrollableMenu();
    this.menu.addMenuItem(this.filesList);
  },

  changeDirectory: function(file_info) {
    this.current_dir = file_info;
    this.setLabel();
    this.loadDirectory();
  },

  loadDirectory: function() {
    this.clearMenu();
    this.addHeader();
    this.addDirContents();
  },

  setLabel: function() {
    if (!this.currentDirIsHome()) {
      this.label.set_text(this.current_dir.get_basename() + arrowText);
    } else {
      this.label.set_text(_(homeText) + arrowText);
    }
  },

  currentDirIsHome: function() {
    return this.current_dir.get_path() == this.home_dir.get_path();
  },

  clearMenu: function() {
    this.header.removeAll();
    this.filesList.removeAll();
  },

  addHeader: function() {
    if (!this.currentDirIsHome()) {
      this.header.addMenuItem(this.makeHomeItem());
    }
    this.header.addMenuItem(this.makeCurrentDirItem());
    if (this.current_dir.has_parent(null)) {
      this.header.addMenuItem(this.makeUpItem());
    }
    this.header.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
  },

  addDirContents: function(file) {
    this.processDirectory(this.current_dir.enumerate_children('*', 0, null, null));
  },

  processDirectory : function(children) {
    let files = [];
    let dirs = [];
    let file_info = null;
    while ((file_info = children.next_file(null, null)) !== null) {
      if (file_info.get_is_hidden()) { continue; }
      if (isDirectory(file_info)) { dirs.push(file_info); }
      else { files.push(file_info); }
    }
    children.close(null, null);

    dirs.sort(fileComparator);
    dirs.forEach(Lang.bind(this, function(fi) {
      this.filesList.addMenuItem(this.createItem(fi));
    }));
    this.filesList.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
    files.sort(fileComparator);
    files.forEach(Lang.bind(this, function(fi) {
      this.filesList.addMenuItem(this.createItem(fi));
    }));
  },

  createItem: function(file_info) {
    return new MenuItem(file_info.get_display_name(), null,
                        file_info.get_symbolic_icon(),
                        this.makeCallback(file_info, ClickBehaviour.DEFAULT));
  },

  makeCallback: function(file_info, onClick) {
    if (onClick === ClickBehaviour.DEFAULT) {
      onClick = isDirectory(file_info) ? ClickBehaviour.CD : ClickBehaviour.OPEN;
    }
    if (onClick === ClickBehaviour.CD) {
      return Lang.bind(this, function() {
          this.changeDirectory(this.current_dir.get_child(file_info.get_name()));
      });
    } else if (onClick === ClickBehaviour.OPEN) {
      return Lang.bind(this, function() {
          this.openItem(this.current_dir.get_child(file_info.get_name()));
      });
    }
  },

  makeHomeItem: function() {
    return new MenuItem(_(homeText), "user-home-symbolic", null,
                        Lang.bind(this, function () {
                          this.changeDirectory(this.home_dir);
                        }));
  },

  makeCurrentDirItem: function(file_info) {
  return new MenuItem(_(openText) + " " + this.current_dir.get_basename(),
                      "document-open-symbolic", null,
                      Lang.bind(this, function() {
                        this.openItem(this.current_dir);
                      }));
  },

  makeUpItem: function() {
  return new MenuItem("..", "go-up-symbolic", null,
                      Lang.bind(this, function() {
                        this.changeDirectory(this.current_dir.get_parent());
                      }));
  },

  openItem: function(file) {
    Gio.app_info_launch_default_for_uri(file.get_uri(), null);
    this.menu.close();
  },

  destroy: function() {
    this.parent();
  }
});


var arrowText = " \u25BE";
var homeText = "Home";
var openText = "Open";

function isDirectory(file) {
  return Gio.FileType.DIRECTORY == file.get_file_type();
}

function fileComparator(l, r) {
  return l.get_display_name().localeCompare(r.get_display_name());
}

var ClickBehaviour = Object.freeze({OPEN: 0, CD: 1, DEFAULT: 2});
