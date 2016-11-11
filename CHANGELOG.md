# league-tooltips - change log

# Current

## **Added :**

* [Demo] Add Yarn support for the deploy script
* Multiple code fixes

# 1.4.3 (Nov. 9th 2016)

## **Fixed :**

* [Server] The Router no longer keep the API as an attribute for security purposes.

# 1.4.2 (Nov. 8th 2016)

## **Added :**

* [Client] The tooltip box no longer overflows after it is rendered with the datas.

## **Changed :**

* Yarn support
* Use Airbnb Javascript guidelines
* Little code fixes

# 1.4.1 (Oct. 22th 2016)

## **Fixed :**

* [Server] Fix `base` option interfering with the main router, causing wrong base route

# 1.4.0 (Oct. 22th 2016)

## **Added :**

* [Server] Set the locale in the api requests instead of a static value in the middleware config
* [Client] Request the locales to server
* [Server] `/version` route
* [Server] `base` middleware option

## **Changed :**

* `leagueTooltipsDebug` changed to `leagueTooltips.debug`

# 1.3.0 (Oct. 21th 2016)

## **Added :**

* [Server] Use node-cache for server side caching.

# 1.2.2 (Oct. 17th 2016)

## **Added :**

* [Client] Display and error if the datas cannot be retrieved

## **Fixed :**

* [Client] Adjust the tooltip position regarding the cursor position and the viewport size

# 1.2.1 (Oct. 15th 2016)

## **Added :**

* [Client] Tooltip's `z-index` property set to 100

# 1.2.0 (Oct. 15th 2016)

## **Added :**

* [debug module](https://www.npmjs.com/package/debug) added (see [here](https://github.com/Ilshidur/league-tooltips#debug))
* [cors](https://github.com/Ilshidur/league-tooltips#--cors) option

# 1.1.1 (Oct. 15th 2016)

## **Fixed :**

* [Server] Fix "Resource interpreted as Stylesheet but transferred with MIME type" warning message on stylesheets.

# 1.1.0 (Oct. 11th 2016)

## **Added :**

* [Client] Show the tooltip error if the request is errored.
* [Client & Server] Add champion spell tooltip.
* [Client] Show "Display error" if the template rendering failed.
* [Client] Retry patch fetching if the patch is empty or errored.
* [Server] Serve sitemaps.

## **Changed :**

* [Server] Remove the "domain.tld" part of the `options.url` as the `fetch()` cross-origin policy will deny the request to other domains.
* [Client] Change 'data-spell' attribute to 'data-summonerspell' for better clarity.

## **Fixed :**

* [Server] Fix "undefined e" error when throwing errors.

# 1.0.4 (Oct. 10th 2016)

## **Fixed :**

* Fix undefined "sources" variable.

# 1.0.3 (Oct. 10th 2016)

## **Fixed :**

* Fix "forbidden protocol" message if undefined and fix protocol not being used properly in the API.
* Fix undefined url not being set to the default value.

# 1.0.2 (Oct. 10th 2016)

## **Removed :**

* Unpublish demo directory on npm.

# 1.0.1 (Oct. 10th 2016)

## **Fixed :**

* Fix missing index.js file causing require fail.

# 1.0.0 (Oct. 10th 2016)

First publish
