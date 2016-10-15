# league-tooltips - change log

# 1.2.0 (Oct. 15th 2016)

**Added :**

* [debug module](https://www.npmjs.com/package/debug) added (see [here](https://github.com/Ilshidur/league-tooltips#debug))

# 1.1.1 (Oct. 15th 2016)

**Fixed :**

* [Server] Fix "Resource interpreted as Stylesheet but transferred with MIME type" warning message on stylesheets.

# 1.1.0 (Oct. 11th 2016)

**Added :**

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
