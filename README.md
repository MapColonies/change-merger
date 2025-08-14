# change-merger
----------------------------------

![badge-alerts-lgtm](https://img.shields.io/lgtm/alerts/github/MapColonies/change-merger?style=for-the-badge)

![grade-badge-lgtm](https://img.shields.io/lgtm/grade/javascript/github/MapColonies/change-merger?style=for-the-badge)

![snyk](https://img.shields.io/snyk/vulnerabilities/github/MapColonies/change-merger?style=for-the-badge)

----------------------------------

This RESTful service merges multiple `osm changes` into one big `osm change`.

Since `v1.4.0` the service is also capable of interpreting `osm changes` into pairs of (`osmId`, `externalId`). interpretation consists of the `created` and `deleted` pairs in the change.

It is also possilbe to interpret by remote `api` or `replication` by providing wanted `changeset id`.

This comes handy for interpreting global or local osm environments, for example, for interpreting specific [global osm](https://api.openstreetmap.org/api/0.6/) `changeset id` via the `api`, or specific changeset id from one of [geofabrik's](https://download.geofabrik.de/europe.html) `replications` by area.

- `app.externalIdTag` - the id mapping\interpreting will pair `osmId` to this tag
- `app.remote.[api/replication].baseUrl` - the remote baseurl - could be global or local osm api/remote
- `app.remote.[api/replication].xApiKey` - if needed, x-api-key authentication for remote request
- `app.remote.[api/replication].username` - if needed, username authentication for remote request
- `app.remote.[api/replication].password` - if needed, password authentication for remote request
- `app.remote.[api/replication].timeoutMs` - the request timeout in ms

## API

Checkout the OpenAPI spec [here](/openapi3.yaml)

## Installation

Install deps with npm

```bash
npm install
```

## Run Locally

Clone the project

```bash

git clone https://github.com/MapColonies/change-merger.git

```

Go to the project directory

```bash

cd change-merger

```

Install dependencies

```bash

npm install

```

Start the server

```bash

npm run start

```

## Running Tests

To run tests, run the following command

```bash

npm run test

```

To only run unit tests:
```bash
npm run test:unit
```

To only run integration tests:
```bash
npm run test:integration
```
