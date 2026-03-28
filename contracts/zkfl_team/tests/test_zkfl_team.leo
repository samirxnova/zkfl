// The 'test_zkfl_team' test program.
import zkfl_team.aleo;
program test_zkfl_team.aleo {
    @test
    script test_it() {
        let result: u32 = zkfl_team.aleo/main(1u32, 2u32);
        assert_eq(result, 3u32);
    }

    @test
    @should_fail
    transition do_nothing() {
        let result: u32 = zkfl_team.aleo/main(2u32, 3u32);
        assert_eq(result, 3u32);
    }

    @noupgrade
    async constructor() {}
}
