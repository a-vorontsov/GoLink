# GoLink

## Installation
1. Run `sudo npm install -g cordova && sudo npm install -g ionic`
2. Run `sudo npm install` to install all the dependencies (this may take some time)
3. Run `ionic platform add android` to add the Android platform
4. Run `gulp build` to create the initial `dist` files

## Testing using your web browser
If you have the [LiveReload Chrome extension](https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei) or its equivalent for your browser, your page will refresh automatically when you make changes, so long as you use `gulp watch`.

1. Run `gulp build && gulp watch` (`build` creates the dist files while `watch` updates them with any changes automatically)
2. Once you see `Starting 'watch'...`, in a separate terminal window, run `ionic serve --nolivereload` (livereload is handled by gulp)  

## Testing on Android
1. Run `gulp build && gulp watch`
2. Plug in your Android device and enable USB debugging
3. In a new terminal window, build the platform by running `ionic build android`
4. Run the platform by running `ionic run android`