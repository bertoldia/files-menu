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
const Lang = imports.lang;
const Gettext = imports.gettext.domain("files-menu");
const _ = Gettext.gettext;


const MenuItem = new Lang.Class({
  Name: 'MenuItem.MenuItem',
  Extends: PopupMenu.PopupBaseMenuItem,

  _init: function(text, icon_name, gicon, callback) {
    this.parent(0.0, text);

    let icon_cfg = { style_class: 'popup-menu-icon' };
    if (icon_name !== null) {
      icon_cfg.icon_name = icon_name;
    } else if (gicon !== null) {
      icon_cfg.gicon = gicon;
    }

    this.icon = new St.Icon(icon_cfg);
    this.actor.add_child(this.icon);
    this.label = new St.Label({ text: text });
    this.actor.add_child(this.label);

    this.connect('activate', callback);
  },

  destroy: function() {
    this.parent();
  }
});
