// The 'test_zkfl_scoring' test program.
import zkfl_scoring.aleo;
program test_zkfl_scoring.aleo {
    @test
    script test_it() {
        let result: u32 = zkfl_scoring.aleo/main(1u32, 2u32);
        assert_eq(result, 3u32);
    }

    @test
    @should_fail
    transition do_nothing() {
        let result: u32 = zkfl_scoring.aleo/main(2u32, 3u32);
        assert_eq(result, 3u32);
    }

    @noupgrade
    async constructor() {}
}
