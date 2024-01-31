# Flatpak

This is a local flapak build used for testing

## Usage

1- Pull the git submodule (this needs to be done only once)

```
  git submodule update --init
```

2- Build and install the app with each change

```
flatpak-builder build-dir io.github.sigmasd.stimulator.yml --force-clean --user --install
```

3- Run the app

```
flatpak run io.github.sigmasd.stimulator
```
