{
    "targets": [
    	{
    		"target_name": "sqlite",
			"sources": [
				"addon.cc",
				"bindings.c",
				"db.c",
				"db_wrapper.cc"
			],
			"conditions": [
				[
					"OS==\"mac\"",
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