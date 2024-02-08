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

## How it works

Uses `Gtk.Application.inhibit (Suspend)` which internally uses
`org.freedesktop.portal.Inhibit` which should work across DEs that supports it.

For disabling screen blanking/locking, it uses `org.freedesktop.ScreenSaver.Inhibit` and fallsback to `Gtk.Application.inhibit (Idle)` if its not supported.

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

| Language   | Translated (%) |
| ---------- | -------------- |
| Arabic     | 65.52          |
| English    | 100.00         |
| Estonian   | 96.55          |
| French     | 65.52          |
| Italian    | 13.79          |
| Portuguese | 96.55          |

- translations less then 70% are not embedded into the app
