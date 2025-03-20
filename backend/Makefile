all: clean sol_build build copy_essentials

sol_build:
	cd contracts && npm install
	solcjs --abi --bin --optimize --overwrite -o contracts_build --base-path . contracts/*.sol

build:
	go mod tidy
	go build -o ./build/backend

copy_essentials:
	cp -r contracts_build/ build/contracts_build
	cp config_default.json build/config.json

clean:
	rm -rf build
	rm -rf contracts_build
	rm -rf contracts/node_modules

reset_config:
	rm config.json
	rm build/config.json
	cp config_default.json config.json
	cp config_default.json build/config.json