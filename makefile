all:
	# Nothing yet...

editor: src/editor/index.html
	mkdir -p build/editor
	cp ./src/editor/index.html ./build/editor/index.html