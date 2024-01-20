# Stimulator

Keep desktop awake

<div style="display:flex;">
<img style="width:25em;" src="https://raw.githubusercontent.com/sigmaSd/Stimulator/master/distro/demo_light_active.png"/>
<img style="width:25em;" src="https://raw.githubusercontent.com/sigmaSd/Stimulator/master/distro/demo_dark_active.png"/>
</div>

[![Get it from FlatHub](https://raw.githubusercontent.com/hmlendea/readme-assets/master/badges/stores/flathub.png)](https://flathub.org/apps/io.github.sigmasd.stimulator)

## How it works

Uses `Gtk.Application.inhibit` which internally uses
`org.freedesktop.portal.Inhibit` which should work across DEs that supports it.

## How to add translations

- Copy content of `en.po` template from
  <a href="https://github.com/sigmaSd/Stimulator/blob/master/po/en.po" target="_blank">here</a>
- Create a new file
  <a href="https://github.com/sigmaSd/Stimulator/tree/master/po" target="_blank">here</a>
  with "Add file" -> "Create new file" button
- Paste content of `en.po` and translate strings
- Name created file as `yourlanguagecode.po`, commit changes and submit pull
  request

## Translations

| Language | Translated (%) |
| -------- | -------------- |
| Arabic   | 66.67          |
| English  | 100.00         |
| Estonian | 100.00         |
| French   | 66.67          |
| Italian  | 55.56          |
