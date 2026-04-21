<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style lang="scss">
	/*每个页面公共css */
	@import '@/uni_modules/uni-scss/index.scss';
	/* #ifndef APP-NVUE */
	@import '@/static/customicons.css';
	// 设置整个项目的背景色
	page {
		background-color: #f5f5f5;
		height: 100%;
		overflow: hidden;
	}

	/* #endif */
	.example-info {
		font-size: 14px;
		color: #333;
		padding: 10px;
	}

	/* H5: keep toast above all custom overlays/dialogs */
	.uni-toast,
	.uni-toast-wrapper,
	.uni-simple-toast,
	[class*='uni-toast'],
	[class*='uni-popup__toast'],
	uni-toast,
	uni-toast-view {
		z-index: 2147483647 !important;
		position: fixed !important;
	}
</style>
