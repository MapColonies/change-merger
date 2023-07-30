# change-merger

----------------------------------

This RESTful service merges multiple `osm changes` into one big `osm change`.

## API

Checkout the OpenAPI spec [here](/openapi3.yaml)

## Installation

Install deps with npm

```bash
npm install
```

### Install Git Hooks
```bash
npx husky install
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
