# No Sleep

Temporarily stops the desktop environment from sleeping.

![image](https://github.com/sigmaSd/gnome-nosleep/assets/22427111/a7d51547-c5de-427e-9cd7-f7be423cbe09)
![image](https://github.com/sigmaSd/gnome-nosleep/assets/22427111/66f72f3b-c415-4f08-8dbf-ab8483e391ff)

[![Get it from FlatHub](https://raw.githubusercontent.com/hmlendea/readme-assets/master/badges/stores/flathub.png)](https://flathub.org/apps/io.github.sigmasd.nosleep)

## How it works

Uses `Gtk.Application.inhibit` which internally uses `org.freedesktop.portal.Inhibit` which should work across DEs that supports it.
