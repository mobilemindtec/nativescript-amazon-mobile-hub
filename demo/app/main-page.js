var Observable = require("data/observable").Observable;
var dialogs = require("ui/dialogs");
var MobileHub = require("nativescript-aws-mobile-hub")

var mobileHub
var modelView

exports.loaded = function(args) {
    var page = args.object;

    modelView = new Observable({
        message: '',
        loading: false
    })

    page.bindingContext = modelView

    mobileHub = new MobileHub({
        mobilehub: {
            userAgent: "MobileHub ba43bb04-d7a3-488e-9dc8-6265a5b7cbcc aws-my-sample-app-android-v0.15"
        },
        cognito: {
            identityPoolID: "us-east-1:09ffe8d1-a4f0-412f-a735-1347c5c11181",
            userPoolID: "us-east-1_Igo0RrJXw",
            userPoolClientID: "65048c1ho78aegb7915re9pho1",
            userPoolClienteSecret: "15gopf47d0l1tvdcr6bc8387ivt2lvsm412st1n4aivlvq8n7s34",
            regionName: "us-east-1"
        },
        dynamonDB: {
            regionName: "us-east-1"
        },
        error: function(data){
            modelView.set('loading', false)
            modelView.set("message", `event: ${data.event}, message: ${data.message}`)
            showAlert(`Error: ${data.message}`)
        },
        success: function(data){
            modelView.set('loading', false)
            modelView.set("message", JSON.stringify(data))
            showAlert(`Success: ${JSON.stringify(data)}`)
        }

    })

}


exports.onSignIn = function(){
    
    modelView.set('loading', true)

    var username = "ricardobocchi"
    var password = "@123QweT$@"

    mobileHub.Cognito.signIn(username, password)    
}


exports.onSignUp = function(){
    
    modelView.set('loading', true)

    var username = "ricardobocchi"
    var password = "@123QweT$!" 
    var givenName = "Ricardo Bocchi"
    var email = "ricardo@mobilemind.com.br"
    var phone = ""

    mobileHub.Cognito.signUp(username, password, givenName, email, phone)
}

exports.onSignUpConfirmationCode = function(){
    modelView.set('loading', true)
    var username = "ricardobocchi"
    var confirmationCode  = "749858"
    mobileHub.Cognito.confirmationCode(username, confirmationCode)   
}

exports.onFetchUserId = function(){
    modelView.set('loading', true)
    mobileHub.Cognito.fetchUserIdentity()
}

exports.onFetchUserInfoAndImage = function(){
    modelView.set('loading', true)
    mobileHub.Cognito.fecheUserInfoAndImage()
}

exports.onGetUserInfo = function(){
    modelView.set('loading', true)
    mobileHub.Cognito.getUserInfo()
}

exports.onSignInPrevious = function(){
    modelView.set('loading', true)
    mobileHub.Cognito.signInPrevious()
}

exports.onForgetPassword = function(){
    modelView.set('loading', true)
    mobileHub.Cognito.forgetPassword("ricardobocchi")   
}

exports.onForgetPasswordCodeConfirmation = function(){
    modelView.set('loading', true)
    mobileHub.Cognito.forgetPasswordVerificationCode("ricardobocchi", "@123QweT$@", "012391")   
}

exports.onFacebookLogin = function(){
    modelView.set('loading', true)
    mobileHub.Cognito.facebookSignIn()      
}

exports.onInsertData = function(){
    var db = mobileHub.DynamonDB
    var cognito = mobileHub.Cognito

    var Category = (function(){

        function Category(params){

            console.log(`init Category with ${JSON.stringify(params)}`)
            params = params || {}

            this.tableName = "secret-mobilehub-1833884911-categories"
            this.attrs = [
                {name: 'id', dynamon: { name: 'id', type: 'text', key: true }, defaultValue: '' },
                {name: 'userId', dynamon: { name: 'userId', type: 'text' }, defaultValue: '' },
                {name: 'description', dynamon: { name: 'description', type: 'text' }, defaultValue: '' }
            ]

            for(var i in this.attrs){
                var attr = this.attrs[i]
                this[attr.name] = params[attr.name] || attr.defaultValue
            }

        }

        return Category

    }())

    modelView.set('loading', true)
    cognito.fetchUserIdentity(function(result){

        console.log(`Cognito.fetchUserIdentity = ${result.data}`)

        var identityId = result.data
        var description = "Category test 2"
        var category = new Category({
            userId: identityId,
            description: description
        })        

        db.save(category).then(function(result){

            modelView.set('loading', false)
            showAlert("save item ok")

        }).catch(function(error){

            modelView.set('loading', false)
            showAlert(error + "")
            
        })


    }, function(error){
        showAlert(error.message)
    })

}


function showAlert(message) {
  var options = {
    title: "AWS Mobile Hub",
    message: message,
    okButtonText: "OK"
  }

  dialogs.alert(options)
}