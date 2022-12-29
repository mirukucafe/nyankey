<template>
<div class="hoawjimk">
	<XBanner v-for="media in mediaList.filter(media => !previewable(media))" :key="media.id" :media="media"/>
	<div v-if="mediaList.filter(media => previewable(media)).length > 0" class="gird-container">
		<div ref="gallery" :data-count="mediaList.filter(media => previewable(media)).length">
			<template v-for="media in mediaList.filter(media => previewable(media))">
				<XVideo v-if="media.type.startsWith('video')" :key="media.id" :video="media"/>
				<XImage v-else-if="media.type.startsWith('image')" :key="media.id" class="image" :data-id="media.id" :image="media" :raw="raw"/>
				<XModPlayer v-else-if="isModule(media)" :key="media.id" :module="media"/>
			</template>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import * as foundkey from 'foundkey-js';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import PhotoSwipe from 'photoswipe';
import 'photoswipe/style.css';
import XBanner from './media-banner.vue';
import XImage from './media-image.vue';
import XVideo from './media-video.vue';
import XModPlayer from './mod-player.vue';
import { FILE_TYPE_BROWSERSAFE, FILE_EXT_TRACKER_MODULES } from '@/const';

const props = defineProps<{
	mediaList: foundkey.entities.DriveFile[];
	raw?: boolean;
}>();

const gallery = ref(null);

onMounted(() => {
	const lightbox = new PhotoSwipeLightbox({
		dataSource: props.mediaList
			.filter(media => {
				if (media.type === 'image/svg+xml') return true; // svgのwebpublicはpngなのでtrue
				return media.type.startsWith('image') && FILE_TYPE_BROWSERSAFE.includes(media.type);
			})
			.map(media => {
				const item = {
					src: media.url,
					w: media.properties.width,
					h: media.properties.height,
					alt: media.comment,
				};
				if (media.properties.orientation != null && media.properties.orientation >= 5) {
					[item.w, item.h] = [item.h, item.w];
				}
				return item;
			}),
		gallery: gallery.value,
		children: '.image',
		thumbSelector: '.image',
		loop: false,
		padding: window.innerWidth > 500 ? {
			top: 32,
			bottom: 32,
			left: 32,
			right: 32,
		} : {
			top: 0,
			bottom: 0,
			left: 0,
			right: 0,
		},
		imageClickAction: 'close',
		tapAction: 'toggle-controls',
		pswpModule: PhotoSwipe,
	});

	lightbox.on('itemData', (ev) => {
		const { itemData } = ev;

		// element is children
		const { element } = itemData;

		const id = element.dataset.id;
		const file = props.mediaList.find(media => media.id === id);

		itemData.src = file.url;
		itemData.w = Number(file.properties.width);
		itemData.h = Number(file.properties.height);
		if (file.properties.orientation != null && file.properties.orientation >= 5) {
			[itemData.w, itemData.h] = [itemData.h, itemData.w];
		}
		itemData.msrc = file.thumbnailUrl;
		itemData.alt = file.comment;
		itemData.thumbCropped = true;
	});

	lightbox.on('uiRegister', () => {
		lightbox.pswp.ui.registerElement({
			name: 'altText',
			className: 'pwsp__alt-text-container',
			appendTo: 'wrapper',
			onInit: (el, pwsp) => {
				let textBox = document.createElement('p');
				textBox.className = 'pwsp__alt-text';
				el.appendChild(textBox);

				let preventProp = function(ev: Event): void {
					ev.stopPropagation();
				};

				// Allow scrolling/text selection
				el.onwheel = preventProp;
				el.onclick = preventProp;
				el.onpointerdown = preventProp;
				el.onpointercancel = preventProp;
				el.onpointermove = preventProp;

				pwsp.on('change', () => {
					textBox.textContent = pwsp.currSlide.data.alt?.trim();
				});
			},
		});
	});

	lightbox.init();
});

const previewable = (file: foundkey.entities.DriveFile): boolean => {
	if (file.type === 'image/svg+xml') return true; // svgのwebpublic/thumbnailはpngなのでtrue
	// FILE_TYPE_BROWSERSAFEに適合しないものはブラウザで表示するのに不適切
	if (isModule(file)) return true;
	return (file.type.startsWith('video') || file.type.startsWith('image')) && FILE_TYPE_BROWSERSAFE.includes(file.type);
};

const isModule = (file: foundkey.entities.DriveFile): boolean => {
	return FILE_EXT_TRACKER_MODULES.some((ext) => {
		return file.name.toLowerCase().endsWith("." + ext);
	});
};

</script>

<style lang="scss" scoped>
.hoawjimk {
	> .gird-container {
		position: relative;
		width: 100%;
		margin-top: 4px;

		&:before {
			content: '';
			display: block;
			padding-top: 56.25% // 16:9;
		}

		> div {
			position: absolute;
			top: 0;
			right: 0;
			bottom: 0;
			left: 0;
			display: grid;
			grid-gap: 8px;

			> * {
				overflow: hidden;
				border-radius: 6px;
			}

			&[data-count="1"] {
				grid-template-rows: 1fr;
			}

			&[data-count="2"] {
				grid-template-columns: 1fr 1fr;
				grid-template-rows: 1fr;
			}

			&[data-count="3"] {
				grid-template-columns: 1fr 0.5fr;
				grid-template-rows: 1fr 1fr;

				> *:nth-child(1) {
					grid-row: 1 / 3;
				}

				> *:nth-child(3) {
					grid-column: 2 / 3;
					grid-row: 2 / 3;
				}
			}

			&[data-count="4"] {
				grid-template-columns: 1fr 1fr;
				grid-template-rows: 1fr 1fr;
			}

			> *:nth-child(1) {
				grid-column: 1 / 2;
				grid-row: 1 / 2;
			}

			> *:nth-child(2) {
				grid-column: 2 / 3;
				grid-row: 1 / 2;
			}

			> *:nth-child(3) {
				grid-column: 1 / 2;
				grid-row: 2 / 3;
			}

			> *:nth-child(4) {
				grid-column: 2 / 3;
				grid-row: 2 / 3;
			}
		}
	}
}
</style>

<style lang="scss">
.pswp {
	// なぜか機能しない
	z-index: 2000000;
}
.pwsp__alt-text-container {
	display: flex;
	flex-direction: row;
	align-items: center;

	position: absolute;
	bottom: 30px;
	left: 50%;
	transform: translateX(-50%);

	width: 75%;
}

.pwsp__alt-text {
	color: white;
	margin: 0 auto;
	text-align: center;
	padding: 10px;
	background: rgba(0, 0, 0, 0.5);
	border-radius: 5px;

	max-height: 10vh;
	overflow-x: clip;
	overflow-y: auto;
	overscroll-behavior: contain;
}

.pwsp__alt-text:empty {
	display: none;
}

</style>
