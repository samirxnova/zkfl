// The 'test_zkfl_prize' test program.
import zkfl_prize.aleo;
program test_zkfl_prize.aleo {
    @test
    script test_it() {
        let result: u32 = zkfl_prize.aleo/main(1u32, 2u32);
        assert_eq(result, 3u32);
    }

    @test
    @should_fail
    transition do_nothing() {
        let result: u32 = zkfl_prize.aleo/main(2u32, 3u32);
        assert_eq(result, 3u32);
    }

    @noupgrade
    async constructor() {}
}
