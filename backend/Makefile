all: clean sol_build build copy_essentials

sol_build:
	cd ../contracts && make all
	cp -r ../contracts/contracts_build/ contracts_build

build:
	go mod tidy
	go build -o ./build/backend

copy_essentials:
	cp -r contracts_build/ build/contracts_build
	cp config_default.json build/config.json

clean:
	rm -rf build
	rm -rf contracts_build

reset_config:
	rm -f config.json
	rm -f build/config.json
	cp config_default.json config.json
	cp config_default.json build/config.json