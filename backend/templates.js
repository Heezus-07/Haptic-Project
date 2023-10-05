function imageListItem({ file_id, filename, id, name, textures }) {
	return `<img 
		hx-on="click: handleImageClick(event, this)" 
		alt="${name}" 
		title="${name}"
		class="picture" 
		data-type="image" 
		id="image-${id}" 
		data-id="${id}" 
		data-name="${name}" 
		data-textures="${textures}" 
		src="/download/${file_id}"
		draggable="false"
	/>`;
}

function textureListItem({ file_id, filename, id, name, audio_file_id }) {
	return `<span><img 
		hx-on="click: handleTextureClick(event, this)" 
		alt="${name}" 
		title="${name}"
		class="picture" 
		data-type="texture" 
		id="texture-${id}" 
		data-id="${id}" 
		data-name="${name}" 
		src="/download/${file_id}"
		draggable="false"
	/><audio 
		id="audio-${audio_file_id}"
		style="display: none" 
		src="/download/${audio_file_id}" 
		loop
	></audio></span>`;
}

function historyItem({ created_at, textures, images, id }) {
	return `<tr id="${id}"><td><a>${created_at}</a></td><td>${textures.map(texture => `<a href="#texture-${texture.id}">${texture.name}</a>`).join(", ")}</td><td>${!images?.length? `<p>MISS</p>`: images.map(image => `<a href="#image-${image.id}">${image.name}</a>`).join(", ")}</td></tr>`;
}

function textureSelectorItem({ id, name, oob }) {
	return `${oob? `<div hx-swap-oob='${oob}'>`: ''}<label id='texture-checkbox-${id}'><input 	
			type='checkbox'
			value="${id}" 
			name='textures'
		> &nbsp; ${name}</label>${oob? `</div>`: ''}`;
}

function textureSelectorRetryFetching() {
	return `<div id="textures-list-load-error">
		Could not load textures. 
		<button 
			hx-get="/textures/list" 
			hx-target="#textures-list-load-error" 
			hx-swap="outerHTML"
		></button>
	</div>`
}

function generatedImage({ name, id, file_id }) {
	return `<img 
		alt="${name}" 
		title="${name}"
		class="picture" 
		data-type="image" 
		data-id="${id}" 
		src="/download/${file_id}"
	/>`;
}

function paragraph(content) {
	return `<p>${content}</p>`
}

function inputLegend(content) {
	return `<legend><i>${content}</i></legend>`
}

module.exports = {
	imageListItem,
	textureListItem,
	paragraph,
	inputLegend,
	textureSelectorItem,
	textureSelectorRetryFetching,
	generatedImage,
	historyItem
};