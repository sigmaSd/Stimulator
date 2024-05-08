# Stimulator

Keep your computer awake

Discussion in Matrix room:
[![Matrix Space](https://img.shields.io/matrix/stimulator:matrix.org)](https://matrix.to/#/#stimulator:matrix.org)

<div style="display:flex;">
<img style="width:25em;" src="https://raw.githubusercontent.com/sigmaSd/Stimulator/master/distro/demo_light_active.png"/>
<img style="width:25em;" src="https://raw.githubusercontent.com/sigmaSd/Stimulator/master/distro/demo_dark_active.png"/>
</div>

<a href='https://flathub.org/apps/io.github.sigmasd.stimulator'>
  <img width='240' alt='Download on Flathub' src='https://dl.flathub.org/assets/badges/flathub-badge-i-en.png'/>
</a>

## Features

- Overrides system setting and disables automatic suspending
- Overrides system setting and disables screen blanking and screen locking
- Option to use system default, light or dark theme
- AppIndicator support

## How it works

Uses `Gtk.Application.inhibit (Suspend)` which internally uses
`org.freedesktop.portal.Inhibit` which should work across DEs that supports it.

For disabling screen blanking/locking, it uses
`org.freedesktop.ScreenSaver.Inhibit` and fallsback to
`Gtk.Application.inhibit (Idle)` if its not supported.

## How to add translations

- Copy content of `en.po` template from
  <a href="https://github.com/sigmaSd/Stimulator/blob/master/po/en.po" target="_blank">here</a>
- Create a new file
  <a href="https://github.com/sigmaSd/Stimulator/tree/master/po" target="_blank">here</a>
  with "Add file" -> "Create new file" button
- Paste content of `en.po` and translate strings
- Supported formats for "translator-credits" field:\
  `msgstr "Your Name"`\
  `msgstr "Your Name <your@email.com>"`\
  `msgstr "Your Name https://yourwebsite.com"`
- Name created file as `yourlanguagecode.po`, commit changes and submit pull
  request

## Translations

| Language   | Translated (%) |
| ---------- | -------------- |
| Arabic     | 100.00         |
| English    | 100.00         |
| Estonian   | 100.00         |
| French     | 100.00         |
| Hindi      | 96.88          |
| Italian    | 100.00         |
| Japanese   | 100.00         |
| Dutch      | 100.00         |
| Portuguese | 100.00         |
| Turkish    | 100.00         |

- Translations with less than 70% completion will not be embedded into the app
