all: clean sol_build make_artifact

sol_build:
	npm install
	solcjs --abi --bin --optimize --overwrite -o contracts_build --base-path . *.sol

make_artifact:
	node scripts/generateArtifact.js

clean:
	rm -rf ./contracts_build
	rm -rf ../frontend/src/artifacts
	rm -rf ./node_modules
