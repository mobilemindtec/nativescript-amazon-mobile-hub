var application = require("application")

var Cognito = (function(){

    function Cognito(signInManager, params){
        this.signInManager = signInManager
        this.errorHandler = params.error
        this.successHandler = params.success

        console.log("MobileHub: init cognito handlers...")
        this.signHandlers()
        console.log("MobileHub: init cognito  handlers ok")

    }

    Cognito.prototype.getIdentityManager = function(){
        return com.amazonaws.mobile.AWSMobileClient.defaultMobileClient().getIdentityManager()
    }

    Cognito.prototype.isSignIn = function(){    
        return this.getIdentityManager().isUserSignedIn()
    }

    Cognito.prototype.signInPrevious = function(){

        var that = this
        var activity = application.android.foregroundActivity || application.android.startActivity
        this.signInProvider = this.signInManager.getPreviouslySignedInProvider()

        if(this.signInProvider){

            var signInResultsHandler = new com.amazonaws.mobile.user.IdentityManager.SignInResultsHandler({
                
                onSuccess: function(provider){
                    console.log("SignInResultsHandler.onSuccess")
                    console.log("User sign-in with previous " + provider.getDisplayName() + " provider succeeded")
                    com.amazonaws.mobile.user.signin.SignInManager.dispose()
                    that.signInProvider = provider

                    that.successHandler({
                        event: 'SignInPrevious',
                        data: {
                            displayName: provider.getDisplayName()
                        }
                    })

                },

                onCancel: function(provider){
                    console.log("SignInResultsHandler.onCancel")
                },

                onError: function(provider, exception){
                    console.log("SignInResultsHandler.onError")
                    that.errorHandler({
                        event: 'SignInPrevious',
                        message: exception.getMessage(),
                        native: exception
                    })
                }
            })

            this.signInManager.refreshCredentialsWithProvider(activity, this.signInProvider, signInResultsHandler);
        } else {
            that.errorHandler({
                event: 'SignInPrevious',
                message: "not previously provider"
            })
        }

    }

    Cognito.prototype.fetchUserIdentity = function(successCallback, errorCallback){

        var that = this
        var errorHandler = errorCallback || that.errorHandler
        var successHandler = successCallback || that.successHandler
       
        this.getIdentityManager().getUserID(new com.amazonaws.mobile.user.IdentityManager.IdentityHandler({

            handleIdentityID: function(identityId) {
                successHandler({
                    event: 'IdentityID',
                    data: identityId
                })
            },

            handleError: function(exception) {                

                errorHandler({
                    event: 'IdentityID',
                    message: exception.getMessage(),
                    native: exception
                })
            }
        }))         
    }

    Cognito.prototype.fecheUserInfoAndImage = function(successCallback, errorCallback){

        var that  = this;
        var errorHandler = errorCallback || that.errorHandler
        var successHandler = successCallback || that.successHandler

        if(this.signInProvider){
            this.getIdentityManager().loadUserInfoAndImage(this.signInProvider, new java.lang.Runnable({
                
                run: function() { 
                    successHandler({
                        event: 'fecheUserInfoAndImage'                        
                    })
                }

            }))
        }else{
            errorHandler({
                event: 'fecheUserInfoAndImage',
                message: 'not sign in provider'
            })
        }
    }

    Cognito.prototype.getUserInfo = function(successCallback, errorCallback){

        var errorHandler = errorCallback || that.errorHandler
        var successHandler = successCallback || that.successHandler

        if (this.getIdentityManager().isUserSignedIn()) {
            successHandler({
                event: 'fecheUserInfoAndImage',
                data: {
                    userName: this.getIdentityManager().getUserName(),
                    userImage: this.getIdentityManager().getUserImage()
                }
            })            
        }else{
            errorHandler({
                event: 'UserInfo',
                message: 'user not sign in'
            })
        }

    }

    Cognito.prototype.signIn = function(username, password){  
        com.amazonaws.mobile.ns.NSProvider.getSignInRequest().request(username, password)
    }

    Cognito.prototype.signUp = function(username, password, givenName, email, phone){    
        com.amazonaws.mobile.ns.NSProvider.getSignUpRequest().request(username, password, givenName, email, phone)
    }   

    Cognito.prototype.facebookSignUp = function(username, password, givenName, email, phone){    
        com.amazonaws.mobile.ns.NSProvider.getSignUpRequest().request(username, password, givenName, email, phone)
    }   

    Cognito.prototype.signOut = function(){    
        this.getIdentityManager().signOut();
    }

    Cognito.prototype.signUpConfirmationCode = function(username, confirmCode){
        com.amazonaws.mobile.ns.NSProvider.getSignUpConfirmationCodeRequest().request(username, confirmCode)
    }

    Cognito.prototype.facebookSignIn = function(){
            
        var that = this
        var activity = application.android.foregroundActivity || application.android.startActivity

        // facebook result handler
        var previesResult = application.android.onActivityResult
        application.android.onActivityResult = function (requestCode, resultCode, data) {
            application.android.onActivityResult = previesResult
            //com.amazonaws.mobile.ns.NSProvider.getFacebookLoginRequest().handleActivityResult(requestCode, resultCode, data)
            that.signInManager.handleActivityResult(requestCode, resultCode, data)
        }

        // call facebook login
        com.amazonaws.mobile.ns.NSProvider.getFacebookLoginRequest().request(activity)


    }

    Cognito.prototype.forgetPassword = function(username){
        com.amazonaws.mobile.ns.NSProvider.getForgetPasswordRequest().request(username)
    }

    Cognito.prototype.forgetPasswordVerificationCode = function(username, newPassword, verificationCode){
        com.amazonaws.mobile.ns.NSProvider.getForgetPasswordRequest().request(username, newPassword, verificationCode)
    }

    Cognito.prototype.signHandlers = function(){

        var that = this

        com.amazonaws.mobile.ns.NSProvider.setSignUpHandler(new com.amazonaws.mobile.ns.NSSignUpHandler({
            onSuccess: function(user, cognitoUserCodeDeliveryDetails){
                console.log('NSSignUpHandler.onSuccess')

               that.successHandler({
                    event: 'SignUp',
                    data: {
                        'userId': user.getUserID()
                    }
                })                
            },

            onFailure: function(exception){
                console.log('NSSignUpHandler.onFailure ' + exception.getMessage())

                that.errorHandler({
                    event: 'SignUp',
                    message: exception.getMessage(),
                    native: exception
                })

            }
        }))

        com.amazonaws.mobile.ns.NSProvider.setSignInHandler(new com.amazonaws.mobile.ns.NSSignInHandler({
            onSuccess: function(provider){
                console.log('NSSignInHandler.onSuccess')

                com.amazonaws.mobile.user.signin.SignInManager.dispose();

                that.signInProvider = provider   


                if(provider instanceof com.amazonaws.mobile.user.signin.FacebookSignInProvider){
                    that.successHandler({
                        event: 'SignIn',
                        data: {
                            message: 'sign in facebook ok'
                        }
                    })                                     
                }else{
                    that.successHandler({
                        event: 'SignIn',
                        data: {
                            message: 'sign in ok'
                        }
                    })                                                         
                }

            },

            onFailure: function(exception){
                console.log('NSSignInHandler.onFailure ' + exception.getMessage())

                that.errorHandler({
                    event: 'SignIn',
                    message: exception.getMessage(),
                    native: exception
                })                
            },

            onCancel: function(){
                that.successHandler({
                    event: 'SignIn',
                    data: {
                        message: 'cancel'
                    }
                })                 
            },

            onGetAuthenticationDetails: function(){

                console.log('NSSignInHandler.onGetAuthenticationDetails ')

                that.successHandler({
                    event: 'SignIn',
                    data: {
                        'message': 'get authentication details'
                    }
                })                                 
            }
        }))    

        com.amazonaws.mobile.ns.NSProvider.setForgetPasswordHandler(new com.amazonaws.mobile.ns.NSForgetPasswordHandler({
            onSuccess: function(){
                console.log('NSForgetPasswordHandler.onSuccess')

               that.successHandler({
                    event: 'ForgetPassword',
                })                   
            },

            onFailure: function(exception){
                console.log('NSForgetPasswordHandler.onFailure ' + exception.getMessage())


                that.errorHandler({
                    event: 'ForgetPassword',
                    message: exception.getMessage(),
                    native: exception
                })                 
            },

            onActivity: function(){
                console.log('NSForgetPasswordHandler.onActivity')

                // open activity to insert verification and new password
                // send veritication code to
                // com.amazonaws.mobile.ns.NSProvider.getForgetPasswordRequest().request(newPassword, verificationCode)
            }
        }))  

        com.amazonaws.mobile.ns.NSProvider.setMfaHandler(new com.amazonaws.mobile.ns.NSMFAHandler({
            onActivity: function(){
                console.log('NSMFAHandler.onActivity')


               that.successHandler({
                    event: 'MFA',
                })                 
            }
        }))                       


        com.amazonaws.mobile.ns.NSProvider.setSignUpConfirmationCodeHandler(new com.amazonaws.mobile.ns.NSSignUpConfirmationCodeHandler({
            onSuccess: function(){
                console.log('NSSignUpConfirmationCodeHandler.onSuccess')

               that.successHandler({
                    event: 'SignUpConfirmation',
                })                 
            },

            onFailure: function(exception){
                console.log('NSSignUpConfirmationCodeHandler.onFailure ' + exception.getMessage())

                that.errorHandler({
                    event: 'SignUpConfirmation',
                    message: exception.getMessage(),
                    native: exception
                })                 
            },

            onActivity: function(){
                console.log('NSSignUpConfirmationCodeHandler.onActivity')

                // open activity to insert verification code and validate new sign up
                // send verirication code to 
                // com.amazonaws.mobile.ns.NSProvider.getSignUpConfirmationCodeRequest().request(username, confirmCode)
            }
        }))  
    


    }        


    return Cognito

})()

module.exports = Cognito