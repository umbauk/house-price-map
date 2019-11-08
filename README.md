<p align="center">
<img src="https://github.com/umbauk/house-price-map/blob/master/client/public/android-chrome-512x512.png" height="100px">
</p>

# House Price Map

### About the Project

- **House Price Map** is an app to show 120k+ historic Dublin property sales overlayed on an interactive map.
- It is a single page app using HTML, CSS, JavaScript and React on the front-end and NodeJS, Mongoose and MongoDB on
  the back-end.
- It uses Google Maps API
- The app is live for users at https://housepricemap.ie (hosted on a Google Cloud Kubernetes cluster)

### Installation

1. Clone the repository.

```bash
git clone https://github.com/umbauk/house-price-map.git
```

2. Install the client dependencies.

```bash
cd client
npm install
```

3. Install server dependencies.

```bash
cd server
npm install
```

4. Import sample_data to a mongodb database.

```bash
mongoimport --db=property_price_database --collection=dublin --type=csv --headerline --file=db/ppr_sample.csv
```

5. Set-up local environment variables.

   1. Create a file named `.env` in the client directory and add the following contents.

   ```text
   REACT_APP_GOOGLE_API_KEY=<YOUR_GOOGLE_MAPS_API_KEY>
   ```

   2. If you don't have a Google Maps API key, you can get one from [here](https://developers.google.com/maps/documentation/javascript/get-api-key).

6. Create a file named `.env` in the server directory and add the following contents.

```text
  GOOGLE_API_KEY=<YOUR_GOOGLE_MAPS_API_KEY>
  MONGO_DB_URI=<YOUR_MONGODB_URI> // e.g. mongodb://localhost:27017/property_price_database
```

6. (TODO) Run Tests.

```bash
npm test
```

7. Run the server.

```bash
cd server
node app.js
```

8. Run the development client.

```bash
cd client
npm start
```
