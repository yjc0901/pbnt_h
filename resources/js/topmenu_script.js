$(document).ready(function(){
	$(".sh_nav").mouseenter(function(){
		$("#shGnb").addClass("on");
        $("#shGnb:not(.fix) .sh_logo img").attr("src","/resources/img/common/logo.png");
        $(".sh_lnb_s").fadeIn(200);
		$(".sh_lnb_bg").fadeIn(200);	
	}).mouseleave(function(){
		$("#shGnb").removeClass("on");
        $("#shGnb:not(.fix) .sh_logo img").attr("src","/resources/img/common/logo.png");
		$('.sh_lnb_s').stop().fadeOut(200);
        $('.sh_lnb_bg').stop().fadeOut(200);
	});

	$(".pf_cate ul > li > a").hover(function(){
		$(".pf_cate ul > li > a").not(this).addClass("off");
	}, function() {
		$(".pf_cate ul > li > a").removeClass("off");
	});	


    pfBtn = $("#pfBtn");
    pfWrap = $("#pfWrap");
    m = 0;  

    /* 닫기 */
    function navClose() { 
        $("body").removeClass("open")
        setTimeout(function() {pfBtn.removeClass("active")},600); 
        pfBtn.addClass("no_pointer")					
        setTimeout(function() {pfBtn.removeClass("no_pointer")},1000); 
        $('.pf_cate').delay(0).animate({"width":"100%"},600,'easeInQuart').delay(350).animate({"width":"0"},0);	
        $('.bg_wrap .bg',pfWrap).delay(300).animate({"width":"0"},600);
        pfWrap.delay(450).fadeOut(250).animate({"left":"-100%"});
        $('.pf_cate > ul > li').delay(0).animate({"margin-left":"100px","opacity":"0"},300,'easeOutQuart');
        $("#m_navBtn").removeClass("on");
		$("#navWrap").fadeOut(300).removeClass("on");	
    }

    pfBtn.click(function(){
        m++;
        if(m%2 == 1){
            /* 열기 */
            $("body").addClass("open")
            pfBtn.addClass("active");
            pfBtn.addClass("no_pointer")					
            setTimeout(function() {pfBtn.removeClass("no_pointer")}, 900);//클릭방지
            $('.pf_cate').delay(0).animate({"width":"70%"},700,'easeOutQuart');
            pfWrap.show().delay(0).animate({"left":"0"},600,'easeOutQuart');	
            $('.pf_cate > ul > li:eq(0)').delay(400).animate({"margin-left":"0","opacity":"1"},600,'easeOutQuart');
            $('.pf_cate > ul > li:eq(1)').delay(500).animate({"margin-left":"0","opacity":"1"},600,'easeOutQuart');
            $('.pf_cate > ul > li:eq(2)').delay(600).animate({"margin-left":"0","opacity":"1"},600,'easeOutQuart');
            $('.pf_cate > ul > li:eq(3)').delay(700).animate({"margin-left":"0","opacity":"1"},600,'easeOutQuart');
            $('.pf_cate > ul > li:eq(4)').delay(800).animate({"margin-left":"0","opacity":"1"},600,'easeOutQuart');
            $('.bg_wrap .bg',pfWrap).delay(300).animate({"width":"100%"},1000,'easeOutQuart');
            pfWrap.show().delay(0).animate({"left":"0"},600,'easeOutQuart');	
        }else{
            navClose(); 
        }; 
    });
    
	/* 반응형 [s] */
	$(document).ready(function() {
        let m = 0; // 변수 초기화
    
        $("#m_navBtn").click(function(){
            m++;
            if(m % 2 === 1){
                $("#m_navBtn").addClass("on");
                $("#navWrap").fadeIn(300).addClass("on");
            } else {
                navClose(); 
            }
        });
    
        $("#topmenuM .m_bmenu").click(function(){
            $('.m_smenu').not($(this).next()).slideUp(200);
            $('.m_bmenu').removeClass('on');
            $(this).addClass('on');
            $(this).next().slideDown(200);
        });
    });
    
    function navClose() {
        $("#m_navBtn").removeClass("on");
        $("#navWrap").fadeOut(300).removeClass("on");
    }
	/* 반응형 [e] */
});