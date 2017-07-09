# GoLink

## Configuration
The configuration variables are stored under `app/app.ts`. On a new installation, replace the configuration variables first. Be sure not to commit them.

## Installation
1. Run `sudo npm install -g cordova && sudo npm install -g ionic` if you have not done so previously
2. Run `sudo npm install` to install all the `node_modules` dependencies (this may take some time)
3. Run `ionic platform add android` to add the Android platform

## Testing using your web browser
If you have the [LiveReload Chrome extension](https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei) or its equivalent for your browser, your page will refresh automatically when you make changes.

1. Run `ionic serve`!

## Testing on Android
1. Plug in your Android device and enable USB debugging
2. In a new terminal window, build the platform by running `ionic build android`
3. Run the platform by running `ionic run android`
