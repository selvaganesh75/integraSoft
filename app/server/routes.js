
var CT = require('./modules/country-list');
var AM = require('./modules/account-manager');
var EM = require('./modules/email-dispatcher');

module.exports = function(app) {

/*
	login & logout
*/

	app.get('/', function(req, res){
	// check if the user has an auto login key saved in a cookie //
		if (req.cookies.login == undefined){
			res.render('admin/login', {error:false});
		}	else{
			// attempt automatic login //
			userVerification(req,res,{page:"dashboard",activeClass:"home"});
		}
	});
	
	function userVerification(req,res,obj){
		AM.validateLoginKey(req.cookies.login, req.ip, function(e, o){
			if (o){
				AM.autoLogin(o.user, o.pass, function(o){
					req.session.user = o;
					req.session.userRole = o.role;
					if(o.role == 'admin'){
						let countUsers = getCollectionCount('accounts',null);
						let countCourse = getCollectionCount('courses',null);
							Promise.all([countUsers,countCourse]).then(function(data){	
								console.log(data);
																
								res.render("admin/home",{[obj.activeClass]:true,name:o.name,userData:o, countries : CT, dashboardData:data, whichPartial: function() { return obj.page; }});
						})
					
					}else{
						res.render('user/home',{title:'User page Loaded', name:req.session.user.name, url:" http://integra.newmediaservices.co.in/Showcase/Integra_Samples/index.html"})
					}
					
				});
			}	else{
				res.render('admin/login', { title: 'Hello - Please Login To Your Account',error:false });
			}
		});
	 }

	async function getCollectionCount(collection,obj){
		 let value = await new Promise((resolve,reject)=>{
			AM.getUserCount(collection,obj,function(count){
				resolve(count);
			})
		 })
		 return value;
	 }

	app.post('/', function(req, res){
		AM.manualLogin(req.body['user'], req.body['pass'], function(e, o){
			if (!o){
				res.render('admin/login', { error: e });
			}	else{
				req.session.user = o;
				req.session.userRole = o.role;
				if (req.body['remember-me'] && req.body['remember-me'] == 'false'){
					if(o.role == 'admin'){
						//get user count  passing collections and object
						let countUsers = getCollectionCount('accounts',null);
						let countCourse = getCollectionCount('courses',null);
						Promise.all([countUsers,countCourse]).then(function(data){

							res.render("admin/home",{home:true,name:o.name,userData:o,countries : CT, dashboardData:data, whichPartial: function() { return "dashboard";  }});
						
						});
						
					}else{

						res.render('user/home',{title:'User page Loaded', name:o.name, url:" http://integra.newmediaservices.co.in/Showcase/Integra_Samples/index.html"})
					}
				}	else{

					AM.generateLoginKey(o.user, req.ip, function(key){

						res.cookie('login', key, { maxAge: 900000 });
							if(o.role == 'admin'){
								let countUsers = getCollectionCount('accounts',null);
								let countCourse = getCollectionCount('courses',null);
								Promise.all([countUsers,countCourse]).then(function(data){
									
							res.render("admin/home",{home:true,name:o.name,userData:o,countries : CT, dashboardData:data, whichPartial: function() { return "dashboard";  }});
						})
								
							}else{
								res.render('user/home',{title:'User page Loaded', name:o.name, url:" http://integra.newmediaservices.co.in/Showcase/Integra_Samples/index.html"})
							}
					
					});
				}
			}
		});
	});

	

	app.post('/logout', function(req, res){
		res.clearCookie('login');
		req.session.destroy(function(e){ res.status(200).send('ok'); });
	})
	
/*
	control panel
*/
	
	app.get('/adminProfile', function(req, res) {
		if (req.session.user == null){
			res.redirect('/');
		}	else{
			userVerification(req,res,{page:"profile",activeClass:"profile"});
			
		}
	});

	/* updating existing user */

	app.post('/admin/updateUser', function(req, res){
		if (req.session.user == null){
			res.redirect('/');
		}else{

			if(req.session.userRole == "admin"){
				AM.updateAccount({
					id		: req.session.user._id,
					name	: req.body['name'],
					email	: req.body['email'],
					pass	: req.body['password'],
					country	: req.body['country']
				}, function(e, o){
					if (e){
						res.status(400).send('error-updating-account');
					}	else{
						req.session.user = o.value;
						res.status(200).send('ok');
					}
				
				});
			}
		}
	});

	/* add user account */

	app.get('/addUser',function(req,res){
		if (req.session.user == null){
			res.redirect('/');
		}	else{
			if(req.session.userRole == "admin"){
				res.render('admin/home', {
					title : 'add User',
					countries : CT,
					add_user:true,
					name:req.session.user.name,
					whichPartial: function() { return "addUser"; }
				});
			}else{
				res.render('user/home',{title:'User page Loaded', name:req.session.user.name, url:" http://integra.newmediaservices.co.in/Showcase/Integra_Samples/index.html"})
			}
		}
	});

/*
	new accounts
*/

	
	app.post('/signup', function(req, res){
		AM.addNewAccount({
			name 	: req.body['name'],
			email 	: req.body['email'],
			user 	: req.body['user'],
			pass	: req.body['pass'],
			country : req.body['country'],
			role : req.body['role']
		}, function(e){
			if (e){
				res.status(400).send(e);
			}	else{
				res.status(200).send('ok');
			}
		});
	});

/*
	password reset
*/

	app.post('/lost-password', function(req, res){
		let email = req.body['email'];
		AM.generatePasswordKey(email, req.ip, function(e, account){
			if (e){
				res.status(400).send(e);
			}	else{
				EM.dispatchResetPasswordLink(account, function(e, m){
			// TODO this callback takes a moment to return, add a loader to give user feedback //
					if (!e){
						res.status(200).send('ok');
					}	else{
						for (k in e) console.log('ERROR : ', k, e[k]);
						res.status(400).send('unable to dispatch password reset');
					}
				});
			}
		});
	});

	app.get('/reset-password', function(req, res) {
		AM.validatePasswordKey(req.query['key'], req.ip, function(e, o){
			if (e || o == null){
				res.redirect('/');
			} else{
				req.session.passKey = req.query['key'];
				res.render('reset', { title : 'Reset Password' });
			}
		})
	});
	
	app.post('/reset-password', function(req, res) {
		let newPass = req.body['pass'];
		let passKey = req.session.passKey;
	// destory the session immediately after retrieving the stored passkey //
		req.session.destroy();
		AM.updatePassword(passKey, newPass, function(e, o){
			if (o){
				res.status(200).send('ok');
			}	else{
				res.status(400).send('unable to update password');
			}
		})
	});
	
/*
	view, delete & reset accounts
*/
	
		
	app.post('/delete', function(req, res){
		AM.deleteAccount(req.session.user._id, function(e, obj){
			if (!e){
				res.clearCookie('login');
				req.session.destroy(function(e){ res.status(200).send('ok'); });
			}	else{
				res.status(400).send('record not found');
			}
		});
	});
	
	app.get('/reset', function(req, res) {
		AM.deleteAllAccounts(function(){
			res.redirect('/print');
		});
	});

	app.post('/editUser',function(req,res){
		var name = req.body['userId']
		AM.getUserData (name,function(e,o){
			
			if(e){
				res.render('404')
			}else{
				if (req.session.user == null){
					res.redirect('/');
				}	else{
					if(req.session.userRole == "admin"){
						res.render('admin/home', {
							name:o.name,userData:o,countries : CT, 
							edit_user:true,
							name:req.session.user.name,
							whichPartial: function() { return "editUser"; }})
					}
				}
			}
		})
		
	})

	app.post('/deleteUser',function(req,res){
		var id = req.body['userId']
		AM.deleteAccount (id,function(e,o){
			console.log(e,o.result.ok)
			if(o.result.ok){
				allRecord(req,res);
			}
		})
		
	})
	

	function allRecord(req,res,dbData){
		AM.getAllRecords(dbData.collection,function(err,obj){
			if(err){
				res.render('404')
			}else{
				if (req.session.user == null){
					res.redirect('/');
				}	else{
					if(req.session.userRole == "admin"){
						//res.send(obj);
						console.log(req.session.user)
						res.render('admin/home', {
							title : 'add User',
							countries : CT,
							[dbData.page]:true,
							userData:obj,
							name:req.session.user.name,
							whichPartial: function() { return dbData.page; }
						});
					}else{
						res.render('user/home',{title:'User page Loaded',name:req.session.user.name, url:" http://integra.newmediaservices.co.in/Showcase/Integra_Samples/index.html"})
					}
				}
				
			}
		})
	}

	app.get('/allUser',function(req,res){
		allRecord(req,res,{page:"allUser",collection:"accounts"});
	});

	app.get('/allCourse',function(req,res){
		allRecord(req,res,{page:"courses",collection:"courses"});
	})
	app.post('/admin/addCourse',function(req,res){
		if(req.session.userRole == "admin"){
			var obj = {courseName:req.body['course'],courseList:req.body['courseList']}
			AM.addNewCourse('courses',obj,function(result){
				res.status(200).send(result);
			});
			
		}else{
			res.redirect('/')
		}
	})

	app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });

};
