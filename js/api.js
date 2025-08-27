// js/api.js

let onSignedInChangedCallback;

function initClient() {
  gapi.client.init({
    clientId: CLIENT_ID,
    discoveryDocs: [DISCOVERY_DOC],
    scope: SCOPES
  }).then(() => {
    const authInstance = gapi.auth2.getAuthInstance();
    authInstance.isSignedIn.listen(onSignedInChangedCallback);
    onSignedInChangedCallback(authInstance.isSignedIn.get());

  }, (error) => {
    console.error('Error initializing Google API client:', error);
    alert('Error initializing Google API: ' + JSON.stringify(error));
  });
}

function loadGapi(callback) {
    onSignedInChangedCallback = callback;
    gapi.load('client:auth2', initClient);
}

function signIn() {
    gapi.auth2.getAuthInstance().signIn();
}

function signOut() {
    gapi.auth2.getAuthInstance().signOut();
}

function getSites() {
    return gapi.client.searchconsole.sites.list();
}

function queryApi(params) {
  return gapi.client.searchconsole.searchanalytics.query({
    siteUrl: params.siteUrl,
    resource: {
      startDate: params.startDate,
      endDate: params.endDate,
      dimensions: params.dimensions,
      rowLimit: 25000
    }
  });
}
