var Home = function(){
    var _this = this;
    this.init = function(){
     
    }
    this.logOut = function(){
        var logOut = { url:'/logout', method:'POST',data:{logout : true} }
       
        this.ajaxCall(logOut,function(result){
            if(result == 'ok'){
                window.location.href = '/';
            }
        });
    }
    this.showDashboard = function(data){
        $('body').append('<form id="dynamicForm" method="get" action='+data+'></form>');
        $('#dynamicForm').submit();        
    }
    this.updateUser = function(e){
        e.preventDefault();
        var updateUser = { url:'/admin/updateUser', method:'POST',data:$('#updateUserForm').serialize() }
        console.log($('#updateUserForm').serialize());
        if(_this.formValidator('#updateUserForm')){
            this.ajaxCall(updateUser,function(result){
                _this.showModal(result);
            });

        } 
    }

    this.addCourse = function(e){
        e.preventDefault();
        var addCourse = { url:'/admin/addCourse', method:'POST',data:$('#addCourse').serialize() }
        if(_this.addUserValidation('#addCourse')){
            $('#addCourse')[0].reset();
            this.ajaxCall(addCourse,function(result){        
                console.log(result);
                       
                _this.showModal(result);
            });
        }
    }

    this.addUser = function(e){
        
        if(_this.formValidator('#addUser')){
            var addUser = { url:'/signup', method:'POST',data:$('#addUser').serialize() }
            this.ajaxCall(addUser,function(result){
                if(result == 'ok'){
                     $('#addUser')[0].reset();
                    _this.showModal('<span class="text-primary">User Inserted Successfully</span>');
                }
            });
        }
        
    }
    this.ajaxCall = function(obj,callback){
        $.ajax({
			url: obj.url,
			type: obj.method,
			data: obj.data || {},
			success: function(data){
                callback(data);                
			},
			error: function(jqXHR){
                _this.showModal('<span class="text-danger">'+jqXHR.responseText+'</span>');
				console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
			}
		});
    }

    this.showModal = function(text){
        text = text || '';
        $('#myModalText').html(text)
        $('#myModal').modal('show');
    }
    this.hideModal = function(){
        $('#myModal').modal('hide');
    }
    this.formValidator = function(formId){
        if(!formId){formId = ''};
        var error = 0;
        var user_name = $(formId+' [name="user"]');
        var name =  $(formId+' [name="name"]')
        var email =  $(formId+' [name="email"]');
        var country =  $(formId+' [name="country"]');
        var password = $(formId+' [name="pass"]');
        var role = $(formId+' [name="role"]');
       
        $(".error").remove();
       
        if (name.length && name.val().length < 1) {
            error++;
            $(name).after('<span class="error text-danger">This field is required</span>');
        }
        if (user_name.length && user_name.val().length < 1) {
            error++;
            $(user_name).after('<span class="error text-danger">This field is required</span>');
        }
        console.log(country.prop('tagName'))
        if(country.prop('tagName')=='SELECT'){
            var sIndex = $(country)[0].selectedIndex
            var sValue = $(country)[0].options[sIndex].dataset['value'];
            if (country.length && sValue.length < 1) {
                error++;
                $(country).after('<span class="error text-danger">This field is required</span>');
            }

        }
        
        if (role.length && role.val().length < 1) {
            error++;
            $(role).after('<span class="error text-danger">This field is required</span>');
        }
        if (email.length && email.val().length < 1) {
            error++;
            $(email).after('<span class="error text-danger">This field is required</span>');
        } else if(email){
            
            if ($(email).val().trim().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/) == null) {
                error++;
                $(email).after('<span class="error text-danger">Enter a valid email</span>');
            }
        }
        if (password.length && password.val().length < 8) {
            error++;
            $(password).after('<span class="error text-danger">Password must be at least 8 characters long</span>');
        }
        if(!user_name.length){return false};
        $('.error').hide().fadeIn();
        if(error>0){
            return false;
        }
        return true;
    }
    this.addUserValidation = function(formId){
        if(!formId){formId = ''};
        var error = 0;
        $(".error").remove();
        var course_name = $(formId+' [name="course"]');
        var courseList =  $(formId+' [name="courseList"]');
        if (course_name.length && course_name.val().length < 1) {
            error++;
            $(course_name).after('<span class="error text-danger">This field is required</span>');
        }
        if (courseList.length && courseList.val().length < 1) {
            error++;
            $(courseList).after('<span class="error text-danger">This field is required</span>');
        }
        $('.error').hide().fadeIn();
        if(error>0){
            return false;
        }
        return true;
    }
}