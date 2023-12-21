# No Sleep

Stop the desktop environment from sleeping

<div style="display:flex;">
<img style="width:25em" src="https://raw.githubusercontent.com/sigmaSd/NoSleep/master/assets/on.png"/>
<img style="width:25em" src="https://raw.githubusercontent.com/sigmaSd/NoSleep/master/assets/off.png"/>
</div>

[![Get it from FlatHub](https://raw.githubusercontent.com/hmlendea/readme-assets/master/badges/stores/flathub.png)](https://flathub.org/apps/io.github.sigmasd.nosleep)

## How it works

Uses `Gtk.Application.inhibit` which internally uses `org.freedesktop.portal.Inhibit` which should work across DEs that supports it.

### Translations

To add a new translation run:
```
cp locales/fr/tranlsation.json locales/$NEW_LANG_PREFIX/tranlsation.json
```
Then edit the file to add the correct translations. 
