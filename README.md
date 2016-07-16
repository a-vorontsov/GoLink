# GoLink

## Installation
1. Run `sudo npm install -g cordova && sudo npm install -g ionic`
2. Follow "Step 0" at https://github.com/mapsplugin/cordova-plugin-googlemaps/wiki/Tutorial-for-Windows, making sure you use Build Tools v23 instead of v24
3. To install the Google Maps dependency, run `npm install`
4. Add the testing platform by running `ionic platform add android`
5.Build the initial Android platform by running `ionic build android`

## Testing
- Run `ionic serve` in order to test aspects which do not require platform dependencies (i.e., Google Maps) in your browser. Displaying locations using the Google Maps API will be broken. 
- If you wish to test features such  as the Google Maps API implementation, plug in an Android device, accept USB debugging and run `ionic run android`