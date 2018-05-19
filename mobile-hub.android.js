var application = require("application")

var DynamonDB = require("./dynamondb")
var Cognito = require("./cognito")

var MobileHub = (function() {
    
    function MobileHub(params){
        this.initSdk(params)
    }

    /*
        params = {
            mobilehub: {
                userAgent:
            },
            cognito: {
                identityPoolID:
                userPoolID:
                userPoolClientID:
                userPoolClienteSecret:
                regionName
            },
            error:
            success
        }
    */
    MobileHub.prototype.initSdk = function(params){

        var AWSConfiguration = com.amazonaws.mobile.AWSConfiguration

        AWSConfiguration.AWS_MOBILEHUB_USER_AGENT = params.mobilehub.userAgent
        AWSConfiguration.AMAZON_COGNITO_IDENTITY_POOL_ID = params.cognito.identityPoolID
        AWSConfiguration.AMAZON_COGNITO_USER_POOL_ID = params.cognito.userPoolID
        AWSConfiguration.AMAZON_COGNITO_USER_POOL_CLIENT_ID = params.cognito.userPoolClientID;
        AWSConfiguration.AMAZON_COGNITO_USER_POOL_CLIENT_SECRET = params.cognito.userPoolClienteSecret;
        
        AWSConfiguration.setRegionCognito(params.cognito.regionName)
        AWSConfiguration.setRegionDynamonDB(params.dynamonDB.regionName)


        this.errorHandler = params.error
        this.successHandler = params.success

        var activity = application.android.foregroundActivity || application.android.startActivity


        console.log("MobileHub: init signIn manager...")
        this.signInManager = com.amazonaws.mobile.user.signin.SignInManager.getInstance(activity)

        this.signInManager.setDefaultResultsHandler(activity)        

        this.signInManager.initialize(com.amazonaws.mobile.user.signin.FacebookSignInProvider.class)
        this.signInManager.initialize(com.amazonaws.mobile.user.signin.CognitoUserPoolsSignInProvider.class)
        console.log("MobileHub: init signIn manager ok")

        

        this.Cognito = new Cognito(this.signInManager, params)
        this.DynamonDB = new DynamonDB()

        com.amazonaws.mobile.AWSMobileClient.initializeMobileClientIfNecessary(activity)
    }


    return MobileHub

})()


module.exports = MobileHub