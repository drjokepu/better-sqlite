{
    "targets": [
    	{
    		"target_name": "sqlite",
			"sources": [
				"src/addon.cc",
				"src/bindings.c",
				"src/db.c",
				"src/db_wrapper.cc"
			],
			"conditions": [
				[
					"OS==\"mac\" and clang==1",
					{
						"xcode_settings": {
							"CLANG_CXX_LANGUAGE_STANDARD": "c++11",
							"CLANG_CXX_LIBRARY": "libc++",
							"MACOSX_DEPLOYMENT_TARGET": "10.7"
						}
					}
				]
			]
    	}
    ]
}