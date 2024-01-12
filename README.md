# Stimulator

Stop the desktop environment from sleeping

<img src="https://raw.githubusercontent.com/sigmaSd/NoSleep/stimulator/distro/demo.png"/>

[![Get it from FlatHub](https://raw.githubusercontent.com/hmlendea/readme-assets/master/badges/stores/flathub.png)](https://flathub.org/apps/io.github.sigmasd.nosleep)

## How it works

Uses `Gtk.Application.inhibit` which internally uses
`org.freedesktop.portal.Inhibit` which should work across DEs that supports it.
